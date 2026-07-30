import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { reportsService } from '@/server/reports/reports.service';

export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const month = req.nextUrl.searchParams.get('month') ?? '';
    return ok(await reportsService.getMonthly(user.userId, month));
  });
}
