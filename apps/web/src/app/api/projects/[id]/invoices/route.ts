import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { validateBody } from '@/server/validate';
import { invoicesService } from '@/server/invoices/invoices.service';
import { CreateInvoiceDto } from '@/server/invoices/dto/create-invoice.dto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const dto = await validateBody(CreateInvoiceDto, await req.json());
    const { id: projectId } = await params;
    return ok(await invoicesService.create(user.userId, projectId, dto));
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id: projectId } = await params;
    return ok(await invoicesService.findAllForProject(user.userId, projectId));
  });
}
