/**
 * POST /api/auth/login
 *
 * Receives { username, password } from the browser, forwards them to the
 * FastAPI internal endpoint, and returns { access_token, token_type, user }.
 *
 * The access_token is also set as an httpOnly cookie for SSR requests.
 */
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const INTERNAL_KEY = process.env.AUTH_INTERNAL_SHARED_SECRET || '';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { detail: 'Username and password are required' },
        { status: 400 },
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/internal/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_KEY,
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Build the response and set httpOnly cookie
    const response = NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
      user: data.user,
    });

    response.cookies.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 h
    });

    return response;
  } catch (error) {
    console.error('[/api/auth/login] Error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 },
    );
  }
}
