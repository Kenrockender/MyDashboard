import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { settingsService } from '@/server/settings/settings.service';
import { UpdateSettingsDto } from '@/server/settings/dto/update-settings.dto';

export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    return ok(await settingsService.get(user.userId));
  });
}

export async function PATCH(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const dto = await validateBody(UpdateSettingsDto, await req.json());
    return ok(await settingsService.update(user.userId, dto));
  });
}
