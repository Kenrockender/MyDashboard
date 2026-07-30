import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { reportsService } from '@/server/reports/reports.service';

export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    return ok(await reportsService.getRevenueBreakdown(user.userId));
  });
}
