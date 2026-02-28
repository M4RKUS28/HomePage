/**
 * Catch-all API proxy – /api/[...path]
 *
 * Every client-side API call (e.g. /api/users/me, /api/projects/) is
 * intercepted here.  Explicit routes like /api/auth/* take precedence
 * in Next.js App Router, so they are NOT affected.
 *
 * Flow:
 *   1. Read the NextAuth session (JWT strategy)
 *   2. If session exists → sign a fresh 30 s internal JWT
 *   3. Forward the request to BACKEND_URL/<path> with the internal JWT
 *   4. Stream the backend response back to the browser
 *
 * The browser NEVER sees the FastAPI JWT – only the NextAuth session cookie.
 */
import { NextResponse } from "next/server";
import { auth, handlers } from "../../../auth";
import { signInternalJWT } from "../../../lib/internal-jwt";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the backend URL from the catch-all path segments + query string.
 *
 * Next.js [...path] strips trailing slashes (e.g. /api/cv/ → ['cv']),
 * but the backend has `redirect_slashes=False`, so we must preserve
 * the original trailing slash from the request URL.
 */
function buildBackendUrl(pathSegments, requestUrl) {
  const path = pathSegments.join("/");
  const url = new URL(requestUrl);
  // Preserve trailing slash: /api/cv/ → /cv/
  const trailingSlash = url.pathname.endsWith("/") ? "/" : "";
  const qs = url.searchParams.toString();
  return `${BACKEND_URL}/${path}${trailingSlash}${qs ? `?${qs}` : ""}`;
}

/**
 * Proxy a request to the FastAPI backend.
 */
async function proxyRequest(request, { params }) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];

    // Next.js routing conflict: [...path] and auth/[...nextauth] are both catch-alls.
    // If Next.js routes NextAuth calls here, explicitly delegate them to Auth.js handlers:
    if (pathSegments.length > 0 && pathSegments[0] === "auth") {
      if (request.method === "GET") return handlers.GET(request);
      if (request.method === "POST") return handlers.POST(request);
      return new NextResponse("Method Not Allowed", { status: 405 });
    }

    const backendUrl = buildBackendUrl(pathSegments, request.url);

    // --- NextAuth session → internal JWT ---
    const session = await auth();

    const headers = new Headers();

    // Sign a fresh short-lived JWT if the user is logged in
    if (session?.user?.id) {
      const token = signInternalJWT({
        userId: session.user.id,
        username: session.user.username,
        isAdmin: session.user.isAdmin,
      });
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Forward relevant request headers
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    const accept = request.headers.get("accept");
    if (accept) headers.set("Accept", accept);

    // --- Build fetch options ---
    const fetchOpts = {
      method: request.method,
      headers,
    };

    // Buffer body for non-GET/HEAD requests.
    // We must buffer (not stream) so we can re-send on 3xx redirects.
    if (!["GET", "HEAD"].includes(request.method)) {
      fetchOpts.body = await request.arrayBuffer();
    }

    // --- Forward to backend (intercept redirects so we can re-send body) ---
    let backendRes = await fetch(backendUrl, {
      ...fetchOpts,
      redirect: "manual",
    });

    // FastAPI uses redirect_slashes=True → trailing-slash 307/308 redirects.
    // Follow one level manually so non-GET methods work correctly.
    if (backendRes.status >= 300 && backendRes.status < 400) {
      const location = backendRes.headers.get("location");
      if (location) {
        // Location may be relative (e.g. "/cv/") – resolve against backend base
        const redirectUrl = location.startsWith("http")
          ? location
          : `${BACKEND_URL}${location}`;
        backendRes = await fetch(redirectUrl, fetchOpts);
      }
    }

    // --- Stream response back ---
    const responseHeaders = new Headers();

    // Forward content-type, content-disposition, etc.
    for (const [key, value] of backendRes.headers.entries()) {
      const lower = key.toLowerCase();
      // Skip headers that NextJS / the browser should manage
      if (["transfer-encoding", "connection", "keep-alive"].includes(lower))
        continue;
      responseHeaders.set(key, value);
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[api/proxy] Error:", error);
    return NextResponse.json(
      { detail: "Proxy error: could not reach backend" },
      { status: 502 },
    );
  }
}

// ---------------------------------------------------------------------------
// Export handlers for all HTTP methods
// ---------------------------------------------------------------------------

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
