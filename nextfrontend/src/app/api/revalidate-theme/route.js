/**
 * Busts the Next.js fetch cache for public settings (accent color) so an
 * admin's change is visible site-wide immediately instead of after the 60s
 * revalidate window. Admin only — invalidating cache is cheap but shouldn't
 * be drive-by callable.
 */
import { revalidateTag } from 'next/cache';
import { auth } from '../../../auth';

export async function POST() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ ok: false }, { status: 403 });
  }

  revalidateTag('public-settings');
  return Response.json({ ok: true });
}
