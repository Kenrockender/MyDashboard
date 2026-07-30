import type { NextRequest } from 'next/server';
import { withRoute } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { invoicesService } from '@/server/invoices/invoices.service';
import { pdfService } from '@/server/pdf/pdf.service';

// The one deliberate exception to this codebase's `{ data }` JSON envelope —
// a PDF isn't JSON, so this route returns the binary body directly.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const { invoice, project, client, incomeLines } = await invoicesService.getPdfData(user.userId, id);
    const buffer = await pdfService.renderInvoice(invoice, project, client, incomeLines);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  });
}
