/**
 * Catch-all API proxy - /api/[...path]
 *
 * Every client-side API call (e.g. /api/users/me, /api/projects/) is
 * intercepted here.  Explicit routes like /api/auth/* take precedence
 * in Next.js App Router, so they are NOT affected.
 *
 * Flow:
 *   1. Read iron-session from the request cookie
 *   2. If session exists → sign a fresh 30 s JWT
 *   3. Forward the request to BACKEND_URL/<path> with the JWT
 *   4. Stream the backend response back to the browser
 *
 * The browser NEVER sees the FastAPI JWT - only the opaque session cookie.
 */
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { signInternalJWT } from '../../../lib/internal-jwt';
import { sessionOptions } from '../../../lib/session';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the backend URL from the catch-all path segments + query string.
 */
function buildBackendUrl(pathSegments, searchParams) {
  const path = pathSegments.join('/');
  const qs = searchParams.toString();
  return `${BACKEND_URL}/${path}${qs ? `?${qs}` : ''}`;
}

/**
 * Proxy a request to the FastAPI backend.
 */
async function proxyRequest(request, { params }) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    const backendUrl = buildBackendUrl(pathSegments, new URL(request.url).searchParams);

    // --- Session & JWT ---
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    const headers = new Headers();

    // Sign a fresh short-lived JWT if the user is logged in
    if (session.userId) {
      const token = signInternalJWT(session);
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Forward relevant request headers
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    const accept = request.headers.get('accept');
    if (accept) headers.set('Accept', accept);

    // --- Build fetch options ---
    const fetchOpts = {
      method: request.method,
      headers,
    };

    // Buffer body for non-GET/HEAD requests.
    // We must buffer (not stream) so we can re-send on 3xx redirects.
    if (!['GET', 'HEAD'].includes(request.method)) {
      fetchOpts.body = await request.arrayBuffer();
    }

    // --- Forward to backend (intercept redirects so we can re-send body) ---
    let backendRes = await fetch(backendUrl, { ...fetchOpts, redirect: 'manual' });

    // FastAPI uses redirect_slashes=True → trailing-slash 307/308 redirects.
    // Follow one level manually so non-GET methods work correctly.
    if (backendRes.status >= 300 && backendRes.status < 400) {
      const location = backendRes.headers.get('location');
      if (location) {
        // Location may be relative (e.g. "/cv/") – resolve against backend base
        const redirectUrl = location.startsWith('http')
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
      if (['transfer-encoding', 'connection', 'keep-alive'].includes(lower)) continue;
      responseHeaders.set(key, value);
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[api/proxy] Error:', error);
    return NextResponse.json(
      { detail: 'Proxy error: could not reach backend' },
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
