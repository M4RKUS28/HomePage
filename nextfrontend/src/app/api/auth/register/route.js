/**
 * POST /api/auth/register
 *
 * Receives { username, email, password } from the browser, forwards them
 * to the FastAPI internal endpoint, and creates an **encrypted iron-session**
 * cookie.  The browser never sees a JWT.
 *
 * Returns: { user }
 */
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const INTERNAL_KEY = process.env.AUTH_INTERNAL_SHARED_SECRET || '';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { detail: 'Username, email, and password are required' },
        { status: 400 },
      );
    }

    // --- Call FastAPI internal register ---
    const backendRes = await fetch(`${BACKEND_URL}/internal/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_KEY,
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // --- Create iron-session with user data ---
    const session = await getSession();
    const user = data.user;

    session.userId = user.id;
    session.username = user.username;
    session.email = user.email;
    session.isAdmin = user.is_admin;
    session.isActive = user.is_active;
    session.avatarUrl = user.profile_image_url || null;
    await session.save();

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[/api/auth/register] Error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 },
    );
  }
}
