/**
 * NextAuth.js v5 (Auth.js) configuration.
 *
 * Uses CredentialsProvider to authenticate against the FastAPI backend
 * via the internal login endpoint.  The session is stored as an encrypted
 * JWT cookie managed entirely by NextAuth — the browser never sees a
 * raw token.
 *
 * Custom user fields (userId, username, isAdmin, …) are persisted in the
 * JWT and exposed through the session object so that both server-side
 * helpers and client components can access them.
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const INTERNAL_KEY = process.env.AUTH_INTERNAL_SHARED_SECRET || '';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.SESSION_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours — matches the old iron-session TTL
  },
  pages: {
    signIn: '/login',
  },
  trustHost: true,

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      /**
       * Validate credentials against FastAPI.
       * Returns a user object on success, or `null` to reject.
       */
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const res = await fetch(`${BACKEND_URL}/internal/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Key': INTERNAL_KEY,
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          const user = data.user;

          // Return shape consumed by the jwt callback below
          return {
            id: String(user.id),
            name: user.username,
            email: user.email,
            username: user.username,
            isAdmin: user.is_admin,
            isActive: user.is_active,
            avatarUrl: user.profile_image_url || null,
            createdAt: user.created_at || null,
            language: user.language || 'en',
          };
        } catch (err) {
          console.error('[auth/authorize] Backend call failed:', err);
          return null;
        }
      },
    }),
  ],

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  callbacks: {
    /**
     * Persist custom fields into the JWT on initial sign-in and on
     * explicit session updates (e.g. after profile edits).
     */
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in — copy user fields into the token
      if (user) {
        token.userId = parseInt(user.id, 10);
        token.username = user.username || user.name;
        token.email = user.email;
        token.isAdmin = user.isAdmin ?? false;
        token.isActive = user.isActive ?? true;
        token.avatarUrl = user.avatarUrl ?? null;
        token.createdAt = user.createdAt ?? null;
        token.language = user.language ?? 'en';
      }

      // Client-triggered update (useSession().update(data))
      if (trigger === 'update' && session) {
        if (session.username !== undefined) token.username = session.username;
        if (session.email !== undefined) token.email = session.email;
        if (session.isAdmin !== undefined) token.isAdmin = session.isAdmin;
        if (session.isActive !== undefined) token.isActive = session.isActive;
        if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl;
        if (session.createdAt !== undefined) token.createdAt = session.createdAt;
        if (session.language !== undefined) token.language = session.language;
        if (session.id !== undefined) token.userId = session.id;
      }

      return token;
    },

    /**
     * Expose the custom token fields on the session so that client
     * components (via `useSession`) and server helpers (via `auth()`)
     * can read them.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.isAdmin = token.isAdmin;
        session.user.isActive = token.isActive;
        session.user.avatarUrl = token.avatarUrl;
        session.user.createdAt = token.createdAt;
        session.user.language = token.language;
      }
      return session;
    },
  },
});
