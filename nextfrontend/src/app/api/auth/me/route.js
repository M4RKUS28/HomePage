/**
 * GET /api/auth/me
 *
 * Returns the current user by forwarding the access_token (from cookie or
 * Authorization header) to the FastAPI /users/me endpoint.
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(request) {
  try {
    // Try cookie first, then Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('access_token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 },
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        err,
        { status: backendRes.status },
      );
    }

    const user = await backendRes.json();
    return NextResponse.json(user);
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 },
    );
  }
}
