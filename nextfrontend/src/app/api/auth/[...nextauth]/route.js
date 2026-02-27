/**
 * NextAuth.js v5 catch-all route handler.
 *
 * Handles all /api/auth/* endpoints that NextAuth manages:
 *   - /api/auth/signin, /api/auth/signout
 *   - /api/auth/session
 *   - /api/auth/callback/credentials
 *   - /api/auth/csrf, /api/auth/providers
 */
import { handlers } from '../../../../auth';

export const { GET, POST } = handlers;
