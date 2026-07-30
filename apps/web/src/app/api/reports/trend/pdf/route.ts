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
    const rows = await reportsService.getMonthlyTrend(user.userId);
    const buffer = await pdfService.renderTrend(rows, { generatedAt: new Date() });
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="monthly-trend.pdf"',
      },
    });
  });
}
