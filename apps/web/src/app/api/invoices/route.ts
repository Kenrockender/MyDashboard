import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { invoicesService } from '@/server/invoices/invoices.service';

export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const status = req.nextUrl.searchParams.get('status') ?? undefined;
    return ok(await invoicesService.findAllForUser(user.userId, status));
  });
}
