export function ErrorState({
  message = "Something went wrong loading this data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-negative/30 bg-negative-soft p-4">
      <p className="text-sm text-negative">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-negative underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  );
}
