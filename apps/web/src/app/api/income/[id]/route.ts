import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { incomeService } from '@/server/income/income.service';
import { CreateIncomeDto } from '@/server/income/dto/create-income.dto';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const dto: Partial<CreateIncomeDto> = await req.json();
    return ok(await incomeService.update(user.userId, id, dto));
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    return ok(await incomeService.remove(user.userId, id));
  });
}
