import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { invoicesService } from '@/server/invoices/invoices.service';
import { clientsService } from '@/server/clients/clients.service';

export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const sp = req.nextUrl.searchParams;
    const search = sp.get('search') ?? undefined;

    // Invoice search matches by number, but a client's name isn't stored on
    // the invoice itself — resolve which clients match first, so the service
    // can also match invoices booked against one of them.
    const matchingClientIds = search
      ? (await clientsService.findAll(user.userId, search, { limit: Number.MAX_SAFE_INTEGER })).items.map(
          (c) => c.id,
        )
      : undefined;

    return ok(
      await invoicesService.findAllForUser(
        user.userId,
        { status: sp.get('status') ?? undefined, search, matchingClientIds },
        {
          cursor: sp.get('cursor') ?? undefined,
          limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
        },
      ),
    );
  });
}
