import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { reportsService } from '@/server/reports/reports.service';

// Everything the Reports page needs, from one pass over the data — replacing
// six separate endpoints that each re-read income and expenses for themselves.
export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    return ok(await reportsService.getSummary(user.userId));
  });
}
