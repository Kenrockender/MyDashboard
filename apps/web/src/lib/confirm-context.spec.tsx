/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ConfirmProvider, useConfirm } from './confirm-context';

function Harness() {
  const confirm = useConfirm();
  const [result, setResult] = useState<string>('idle');

  async function ask() {
    setResult('waiting');
    const confirmed = await confirm({
      message: 'Delete this expense of $50.00?',
      title: 'Are you sure?',
      confirmLabel: 'Delete',
      tone: 'negative',
    });
    setResult(confirmed ? 'confirmed' : 'cancelled');
  }

  return (
    <div>
      <button onClick={ask}>Ask</button>
      <p>result: {result}</p>
    </div>
  );
}

function renderHarness() {
  return render(
    <ConfirmProvider>
      <Harness />
    </ConfirmProvider>,
  );
}

describe('ConfirmProvider / useConfirm', () => {
  it('renders no dialog until confirm() is called', () => {
    renderHarness();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('resolves true when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText('Ask'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Delete this expense of $50.00?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('result: confirmed')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('resolves false when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText('Ask'));
    await user.click(screen.getByText('Cancel'));

    expect(await screen.findByText('result: cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('resolves false when clicking the backdrop', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText('Ask'));
    // the backdrop itself has no accessible role, so reach it via the dialog's parent
    await user.click(screen.getByRole('alertdialog').parentElement!);

    expect(await screen.findByText('result: cancelled')).toBeInTheDocument();
  });

  it('resolves false on Escape', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText('Ask'));
    await user.keyboard('{Escape}');

    expect(await screen.findByText('result: cancelled')).toBeInTheDocument();
  });

  it('does not close when clicking inside the dialog itself', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText('Ask'));
    await user.click(screen.getByText('Are you sure?'));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('result: waiting')).toBeInTheDocument();
  });

  it('defaults to the negative variant styling on the confirm button when tone is negative', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByText('Ask'));
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-negative');
  });

  it('falls back to a no-op resolving false when used outside a ConfirmProvider', async () => {
    render(<Harness />);
    await userEvent.setup().click(screen.getByText('Ask'));
    expect(await screen.findByText('result: cancelled')).toBeInTheDocument();
  });
});
