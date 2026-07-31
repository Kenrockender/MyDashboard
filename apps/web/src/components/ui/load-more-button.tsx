import { LinkButton } from './button';

export function LoadMoreButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="flex justify-center border-t border-hair px-5 py-3.5">
      <LinkButton onClick={onClick} disabled={loading}>
        {loading ? 'Loading…' : 'Load more'}
      </LinkButton>
    </div>
  );
}
