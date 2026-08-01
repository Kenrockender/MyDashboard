import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { notificationsService } from '@/server/notifications/notifications.service';

// Both notification kinds in one request — the bell polls, so halving the
// round trips (and sharing the projects read behind them) matters here.
export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    return ok(await notificationsService.getAll(user.userId));
  });
}
