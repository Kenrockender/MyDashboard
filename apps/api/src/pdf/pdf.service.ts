import { Injectable } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { buildInvoiceDocument } from './documents/invoice-document';
import { buildReportDocument, type ReportType, type ReportRow } from './documents/report-document';
import { buildTrendDocument } from './documents/trend-document';
import type { Invoice } from '../invoices/invoices.service';
import type { Project } from '../projects/projects.service';
import type { Client } from '../clients/clients.service';
import type { Income } from '../income/income.service';
import type { MonthlyTrendEntry } from '../dashboard/calculate-monthly-trend';

@Injectable()
export class PdfService {
  renderInvoice(
    invoice: Invoice,
    project: Project,
    client: Client | null,
    incomeLines: Income[],
  ): Promise<Buffer> {
    return renderToBuffer(
      buildInvoiceDocument({ invoice, project, client, incomeLines }),
    );
  }

  renderReport(
    type: ReportType,
    rows: ReportRow[],
    meta: { generatedAt: Date; contextLabel?: string },
  ): Promise<Buffer> {
    return renderToBuffer(buildReportDocument({ type, rows, ...meta }));
  }

  renderTrend(rows: MonthlyTrendEntry[], meta: { generatedAt: Date }): Promise<Buffer> {
    return renderToBuffer(buildTrendDocument({ rows, ...meta }));
  }
}
