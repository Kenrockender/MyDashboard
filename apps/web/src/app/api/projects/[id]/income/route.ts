import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { incomeService } from '@/server/income/income.service';
import { CreateIncomeDto } from '@/server/income/dto/create-income.dto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const dto = await validateBody(CreateIncomeDto, await req.json());
    const { id: projectId } = await params;
    return ok(await incomeService.create(user.userId, projectId, dto));
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id: projectId } = await params;
    return ok(await incomeService.findAll(user.userId, projectId));
  });
}
