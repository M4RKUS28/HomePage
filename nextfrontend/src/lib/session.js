/**
 * iron-session configuration.
 *
 * The session cookie is an **encrypted** httpOnly cookie that only lives
 * on the browser ↔ NextJS boundary.  The browser can never read its
 * contents - it is an opaque blob.
 *
 * Session shape:
 *   { userId, username, email, isAdmin, isActive, avatarUrl? }
 */
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export const sessionOptions = {
  cookieName: 'hp_session',
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_change_me',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

/**
 * Get the current session from cookies (for use in API routes & RSC).
 *
 * @returns {Promise<import('iron-session').IronSession>}
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession(cookieStore, sessionOptions);
}
