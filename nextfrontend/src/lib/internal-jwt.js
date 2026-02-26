/**
 * Internal JWT helper - signs short-lived HMAC-HS256 tokens for
 * NextJS → FastAPI communication.
 *
 * These tokens are **never** sent to the browser.  They are created
 * fresh for every proxied request and expire after 30 seconds.
 *
 * Payload format expected by FastAPI ``decode_internal_token``:
 *   { sub: <username>, user_id: <int>, is_admin: <bool>, exp: <unix> }
 */
import jwt from 'jsonwebtoken';

const SHARED_SECRET = process.env.AUTH_INTERNAL_SHARED_SECRET || '';

/**
 * Sign a short-lived JWT for a single backend request.
 *
 * @param {{ userId: number, username: string, isAdmin: boolean }} session
 * @returns {string} signed JWT (HS256, 30 s TTL)
 */
export function signInternalJWT(session) {
  if (!SHARED_SECRET) {
    throw new Error('AUTH_INTERNAL_SHARED_SECRET is not configured');
  }

  return jwt.sign(
    {
      sub: session.username,
      user_id: session.userId,
      is_admin: session.isAdmin,
    },
    SHARED_SECRET,
    { algorithm: 'HS256', expiresIn: '30s' },
  );
}
