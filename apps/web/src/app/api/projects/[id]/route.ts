import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { projectsService } from '@/server/projects/projects.service';
import { CreateProjectDto } from '@/server/projects/dto/create-project.dto';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    return ok(await projectsService.findOne(user.userId, id));
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const dto: Partial<CreateProjectDto> = await req.json();
    return ok(await projectsService.update(user.userId, id, dto));
  });
}
