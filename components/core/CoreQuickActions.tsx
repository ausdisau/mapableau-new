import Link from "next/link";

export function CoreQuickActions() {
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-2">
      <Link
        href="/login"
        className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Sign in
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Go to control panel
      </Link>
    </div>
  );
}
