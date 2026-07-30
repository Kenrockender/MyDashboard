import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { taxService } from '@/server/tax/tax.service';

export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const yearParam = req.nextUrl.searchParams.get('year');
    const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
    return ok(await taxService.getPphUmkmEstimate(user.userId, year));
  });
}
