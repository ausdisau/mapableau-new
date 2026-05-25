export function TypingIndicator({ names }: { names: string[] }) {
  if (!names.length) return null;
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.slice(0, 2).join(", ")} are typing`;

  return (
    <p className="px-4 py-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <span className="sr-only">Typing status: </span>
      {label}
      <span aria-hidden="true">…</span>
    </p>
  );
}
