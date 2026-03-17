export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--danger-text)]">
      <span>!</span> {message}
    </p>
  );
}
