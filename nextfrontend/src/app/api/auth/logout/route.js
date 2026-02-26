/**
 * POST /api/auth/logout
 *
 * Destroys the iron-session (encrypted cookie) and returns a success response.
 */
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';

export async function POST() {
  const session = await getSession();
  session.destroy();

  return NextResponse.json({ message: 'Logged out' });
}
