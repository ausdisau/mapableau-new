import Link from "next/link";

export function QsPlaceholderSection({
  title,
  wave,
  summary,
}: {
  title: string;
  wave: string;
  summary: string;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{summary}</p>
      <p className="text-sm">
        Planned for <strong>{wave}</strong>. Foundation permissions, signals,
        deadlines, and audit are available now.
      </p>
      <Link
        href="/admin/ops/quality-safeguards/inbox"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Go to Safeguards inbox
      </Link>
    </div>
  );
}
