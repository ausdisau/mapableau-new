interface VerificationNoticeProps {
  title?: string;
  message: string;
}

export function VerificationNotice({
  title = "Verification required",
  message,
}: VerificationNoticeProps) {
  return (
    <aside
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
      role="note"
    >
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-muted-foreground">{message}</p>
    </aside>
  );
}
