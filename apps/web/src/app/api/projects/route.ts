import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { projectsService } from '@/server/projects/projects.service';
import { CreateProjectDto } from '@/server/projects/dto/create-project.dto';

export async function POST(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const dto = await validateBody(CreateProjectDto, await req.json());
    return ok(await projectsService.create(user.userId, dto));
  });
}

export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const sp = req.nextUrl.searchParams;
    return ok(
      await projectsService.findAll(user.userId, {
        status: sp.get('status') ?? undefined,
        clientId: sp.get('clientId') ?? undefined,
        search: sp.get('search') ?? undefined,
        dealType: sp.get('dealType') ?? undefined,
      }),
    );
  });
}
