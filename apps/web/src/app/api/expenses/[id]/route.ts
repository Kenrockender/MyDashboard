import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { expensesService } from '@/server/expenses/expenses.service';
import { CreateExpenseDto } from '@/server/expenses/dto/create-expense.dto';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const dto: Partial<CreateExpenseDto> = await req.json();
    return ok(await expensesService.update(user.userId, id, dto));
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    return ok(await expensesService.remove(user.userId, id));
  });
}
