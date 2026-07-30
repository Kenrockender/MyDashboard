import { pdfService } from './pdf.service';

describe('PdfService', () => {
  it('renders an invoice to a PDF buffer', async () => {
    const buffer = await pdfService.renderInvoice(
      {
        id: 'inv_1',
        userId: 'user_1',
        projectId: 'proj_1',
        clientId: 'client_1',
        invoiceNumber: 'INV-2026-0001',
        incomeIds: ['inc_1'],
        currency: 'USD',
        subtotal: 1000,
        status: 'draft',
        issueDate: new Date('2026-06-01'),
        dueDate: new Date('2026-06-15'),
        notes: 'Thanks!',
        sentAt: null,
        paidAt: null,
        createdAt: new Date('2026-06-01'),
      },
      {
        id: 'proj_1',
        userId: 'user_1',
        name: 'Website Redesign',
        status: 'active',
        dealType: 'ongoing',
        archived: false,
        createdAt: new Date(),
      },
      { id: 'client_1', userId: 'user_1', name: 'Acme Corp', createdAt: new Date() },
      [
        {
          id: 'inc_1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 1000,
          currency: 'USD',
          description: 'Milestone 1',
          status: 'paid',
          date: new Date('2026-05-15'),
          createdAt: new Date(),
        },
      ],
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('renders a report to a PDF buffer, one section per currency', async () => {
    const buffer = await pdfService.renderReport(
      'expenses',
      [
        { category: 'hosting', currency: 'USD', total: 50 },
        { category: 'hosting', currency: 'IDR', total: 500000 },
      ],
      { generatedAt: new Date('2026-07-01') },
    );

    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('renders the monthly trend to a PDF buffer, one chart per currency', async () => {
    const buffer = await pdfService.renderTrend(
      [
        { month: '2026-05', currency: 'USD', revenue: 1000, expenses: 100, profit: 900 },
        { month: '2026-06', currency: 'USD', revenue: 2000, expenses: 300, profit: 1700 },
        { month: '2026-06', currency: 'IDR', revenue: 5000000, expenses: 0, profit: 5000000 },
      ],
      { generatedAt: new Date('2026-07-01') },
    );

    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('renders an empty trend without throwing', async () => {
    const buffer = await pdfService.renderTrend([], { generatedAt: new Date() });
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('renders an empty report without throwing', async () => {
    const buffer = await pdfService.renderReport('revenue', [], {
      generatedAt: new Date(),
    });

    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });
});
