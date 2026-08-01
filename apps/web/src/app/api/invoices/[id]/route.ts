import type { NextRequest } from 'next/server';
import { withRoute, ok } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { invoicesService } from '@/server/invoices/invoices.service';
import { UpdateInvoiceDto } from '@/server/invoices/dto/update-invoice.dto';

// Returns the joined view (project/client/income lines), not the bare invoice
// document — an invoice on its own is just ids and a total, which isn't enough
// to render the detail page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    return ok(await invoicesService.getDetail(user.userId, id));
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const dto: UpdateInvoiceDto = await req.json();
    return ok(await invoicesService.update(user.userId, id, dto));
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    return ok(await invoicesService.remove(user.userId, id));
  });
}
