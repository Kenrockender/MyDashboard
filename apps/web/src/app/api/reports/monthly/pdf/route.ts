import type { NextRequest } from 'next/server';
import { withRoute } from '@/server/respond';
import { requireUser } from '@/server/require-user';
import { reportsService } from '@/server/reports/reports.service';
import { pdfService } from '@/server/pdf/pdf.service';

// The one deliberate exception to this codebase's `{ data }` JSON envelope —
// a PDF isn't JSON, so this route returns the binary body directly.
export async function GET(req: NextRequest) {
  return withRoute(req, async () => {
    const user = await requireUser(req);
    const month = req.nextUrl.searchParams.get('month') ?? '';
    const rows = await reportsService.getMonthly(user.userId, month);
    const buffer = await pdfService.renderReport('monthly', rows, { generatedAt: new Date(), contextLabel: month });
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="monthly-report-${month}.pdf"`,
      },
    });
  });
}
