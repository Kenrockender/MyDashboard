import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { clientsService } from '@/server/clients/clients.service';
import { CreateClientDto } from '@/server/clients/dto/create-client.dto';

export async function POST(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const dto = await validateBody(CreateClientDto, await req.json());
    return ok(await clientsService.create(user.userId, dto));
  });
}

export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const sp = req.nextUrl.searchParams;
    return ok(
      await clientsService.findAll(user.userId, sp.get('search') ?? undefined, {
        cursor: sp.get('cursor') ?? undefined,
        limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      }),
    );
  });
}
