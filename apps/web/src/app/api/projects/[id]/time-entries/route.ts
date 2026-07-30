import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { timeEntriesService } from '@/server/time-entries/time-entries.service';
import { CreateTimeEntryDto } from '@/server/time-entries/dto/create-time-entry.dto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const dto = await validateBody(CreateTimeEntryDto, await req.json());
    const { id: projectId } = await params;
    return ok(await timeEntriesService.create(user.userId, projectId, dto));
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id: projectId } = await params;
    return ok(await timeEntriesService.findAll(user.userId, projectId));
  });
}
