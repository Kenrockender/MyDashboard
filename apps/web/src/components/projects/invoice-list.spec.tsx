/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/lib/toast-context';
import { ConfirmProvider } from '@/lib/confirm-context';
import { InvoiceList } from './invoice-list';

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), getBlob: jest.fn() },
}));

import { apiClient } from '@/lib/api-client';
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const INCOME = [
  {
    id: 'inc_usd',
    amount: 500,
    currency: 'USD',
    description: 'Milestone 1',
    status: 'pending',
    date: '2026-07-01',
  },
  {
    id: 'inc_idr',
    amount: 1_000_000,
    currency: 'IDR',
    description: 'Milestone 2 (IDR)',
    status: 'pending',
    date: '2026-07-05',
  },
];

function mockGet(overrides: { invoices?: unknown[] } = {}) {
  mockApiClient.get.mockImplementation((path: string) => {
    if (path === '/projects/proj_1/invoices') return Promise.resolve(overrides.invoices ?? []);
    if (path === '/projects/proj_1/income') return Promise.resolve(INCOME);
    if (path.startsWith('/clients')) return Promise.resolve([]);
    throw new Error(`Unexpected GET ${path}`);
  });
}

function renderInvoiceList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <InvoiceList projectId="proj_1" />
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('InvoiceList — multi-currency income selection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGet();
  });

  it('lets any currency be selected first', async () => {
    renderInvoiceList();

    expect(await screen.findByRole('checkbox', { name: 'Milestone 1' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Milestone 2 (IDR)' })).toBeEnabled();
  });

  it('disables income in other currencies once one is selected', async () => {
    const user = userEvent.setup();
    renderInvoiceList();

    const usd = await screen.findByRole('checkbox', { name: 'Milestone 1' });
    const idr = screen.getByRole('checkbox', { name: 'Milestone 2 (IDR)' });

    await user.click(usd);

    expect(usd).toBeChecked();
    expect(usd).toBeEnabled();
    expect(idr).toBeDisabled();
    expect(idr).not.toBeChecked();
  });

  it('re-enables every currency once the selection is cleared', async () => {
    const user = userEvent.setup();
    renderInvoiceList();

    const usd = await screen.findByRole('checkbox', { name: 'Milestone 1' });
    const idr = screen.getByRole('checkbox', { name: 'Milestone 2 (IDR)' });

    await user.click(usd);
    expect(idr).toBeDisabled();

    await user.click(usd);
    expect(idr).toBeEnabled();
  });

  it('excludes income already covered by an existing invoice', async () => {
    mockGet({
      invoices: [
        {
          id: 'inv_1',
          projectId: 'proj_1',
          clientId: null,
          invoiceNumber: 'INV-2026-0001',
          incomeIds: ['inc_usd'],
          currency: 'USD',
          subtotal: 500,
          status: 'draft',
          issueDate: '2026-07-01',
          dueDate: null,
        },
      ],
    });

    renderInvoiceList();

    expect(await screen.findByRole('checkbox', { name: 'Milestone 2 (IDR)' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Milestone 1' })).not.toBeInTheDocument();
  });

  it('disables "Create invoice" until at least one income line is selected', async () => {
    const user = userEvent.setup();
    renderInvoiceList();

    const usd = await screen.findByRole('checkbox', { name: 'Milestone 1' });
    const submit = screen.getByRole('button', { name: 'Create invoice' });
    expect(submit).toBeDisabled();

    await user.click(usd);
    expect(submit).toBeEnabled();
  });
});
