import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { expensesService } from '@/server/expenses/expenses.service';
import { CreateExpenseDto } from '@/server/expenses/dto/create-expense.dto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const dto = await validateBody(CreateExpenseDto, await req.json());
    const { id: projectId } = await params;
    return ok(await expensesService.create(user.userId, projectId, dto));
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id: projectId } = await params;
    return ok(await expensesService.findAll(user.userId, projectId));
  });
}
