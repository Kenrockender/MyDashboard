import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { clientsService } from '@/server/clients/clients.service';
import { CreateClientDto } from '@/server/clients/dto/create-client.dto';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    return ok(await clientsService.findOne(user.userId, id));
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const dto: Partial<CreateClientDto> = await req.json();
    return ok(await clientsService.update(user.userId, id, dto));
  });
}
