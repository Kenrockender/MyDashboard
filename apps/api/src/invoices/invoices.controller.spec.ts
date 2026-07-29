import { Test } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  const mockService = {
    create: jest
      .fn()
      .mockResolvedValue({ id: 'inv_1', invoiceNumber: 'INV-2026-0001' }),
    findAllForProject: jest.fn().mockResolvedValue([]),
    findAllForUser: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 'inv_1' }),
    update: jest.fn().mockResolvedValue({ id: 'inv_1', status: 'paid' }),
    send: jest.fn().mockResolvedValue({ id: 'inv_1', status: 'sent' }),
    remove: jest.fn().mockResolvedValue({ id: 'inv_1' }),
    getPdfData: jest.fn().mockResolvedValue({
      invoice: { id: 'inv_1', invoiceNumber: 'INV-2026-0001' },
      project: { id: 'proj_1', name: 'Website Redesign' },
      client: null,
      incomeLines: [],
    }),
  };
  const mockPdfService = {
    renderReport: jest.fn(),
    renderInvoice: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7 fake')),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        { provide: InvoicesService, useValue: mockService },
        { provide: PdfService, useValue: mockPdfService },
      ],
    }).compile();
    controller = module.get(InvoicesController);
  });

  it('creates an invoice for a project', async () => {
    const dto = { incomeIds: ['inc_1', 'inc_2'] };
    const result = await controller.create('proj_1', dto, {
      userId: 'user_1',
    });
    expect(result.data.invoiceNumber).toBe('INV-2026-0001');
    expect(mockService.create).toHaveBeenCalledWith('user_1', 'proj_1', dto);
  });

  it('lists invoices for a project', async () => {
    await controller.findAllForProject('proj_1', { userId: 'user_1' });
    expect(mockService.findAllForProject).toHaveBeenCalledWith(
      'user_1',
      'proj_1',
    );
  });

  it('lists all invoices for the user, optionally filtered by status', async () => {
    await controller.findAllForUser({ userId: 'user_1' }, 'sent');
    expect(mockService.findAllForUser).toHaveBeenCalledWith('user_1', 'sent');
  });

  it('gets one invoice', async () => {
    await controller.findOne('inv_1', { userId: 'user_1' });
    expect(mockService.findOne).toHaveBeenCalledWith('user_1', 'inv_1');
  });

  it('updates status/dueDate/notes', async () => {
    const dto = { status: 'paid' };
    const result = await controller.update('inv_1', dto, {
      userId: 'user_1',
    });
    expect(result.data.status).toBe('paid');
    expect(mockService.update).toHaveBeenCalledWith('user_1', 'inv_1', dto);
  });

  it('sends an invoice', async () => {
    const result = await controller.send('inv_1', { userId: 'user_1' });
    expect(result.data.status).toBe('sent');
    expect(mockService.send).toHaveBeenCalledWith('user_1', 'inv_1');
  });

  it('deletes a draft invoice', async () => {
    await controller.remove('inv_1', { userId: 'user_1' });
    expect(mockService.remove).toHaveBeenCalledWith('user_1', 'inv_1');
  });

  it('streams a rendered PDF for an invoice', async () => {
    const res = { set: jest.fn(), send: jest.fn() } as any;
    await controller.downloadPdf('inv_1', { userId: 'user_1' }, res);

    expect(mockService.getPdfData).toHaveBeenCalledWith('user_1', 'inv_1');
    expect(mockPdfService.renderInvoice).toHaveBeenCalledWith(
      { id: 'inv_1', invoiceNumber: 'INV-2026-0001' },
      { id: 'proj_1', name: 'Website Redesign' },
      null,
      [],
    );
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'application/pdf' }),
    );
    expect(res.send).toHaveBeenCalledWith(Buffer.from('%PDF-1.7 fake'));
  });
});
