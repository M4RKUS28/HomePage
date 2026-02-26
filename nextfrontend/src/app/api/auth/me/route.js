/**
 * GET /api/auth/me
 *
 * Returns the current user from the iron-session.  Optionally fetches
 * fresh data from FastAPI to keep session data in sync.
 */
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { signInternalJWT } from '../../../../lib/internal-jwt';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 },
      );
    }

    // Fetch fresh user data from the backend to keep session in sync
    try {
      const token = signInternalJWT(session);
      const backendRes = await fetch(`${BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (backendRes.ok) {
        const user = await backendRes.json();

        // Update session with fresh data
        session.username = user.username;
        session.email = user.email;
        session.isAdmin = user.is_admin;
        session.isActive = user.is_active;
        session.avatarUrl = user.profile_image_url || null;
        await session.save();

        return NextResponse.json(user);
      }
    } catch {
      // Backend unreachable - fall through to cached session data
    }

    // Fallback: return user data from session
    return NextResponse.json({
      id: session.userId,
      username: session.username,
      email: session.email,
      is_admin: session.isAdmin,
      is_active: session.isActive,
      profile_image_url: session.avatarUrl || null,
    });
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 },
    );
  }
}
