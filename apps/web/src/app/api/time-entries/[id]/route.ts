import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { timeEntriesService } from '@/server/time-entries/time-entries.service';
import { UpdateTimeEntryDto } from '@/server/time-entries/dto/update-time-entry.dto';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const dto = await validateBody(UpdateTimeEntryDto, await req.json());
    return ok(await timeEntriesService.update(user.userId, id, dto));
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    return ok(await timeEntriesService.remove(user.userId, id));
  });
}
