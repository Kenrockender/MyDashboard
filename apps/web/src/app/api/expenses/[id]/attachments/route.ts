import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { attachmentsService } from '@/server/attachments/attachments.service';
import { CreateAttachmentDto } from '@/server/attachments/dto/create-attachment.dto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const dto = await validateBody(CreateAttachmentDto, await req.json());
    const { id: expenseId } = await params;
    return ok(await attachmentsService.create(user.userId, expenseId, dto));
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id: expenseId } = await params;
    return ok(await attachmentsService.findAllForExpense(user.userId, expenseId));
  });
}
