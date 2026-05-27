import Link from "next/link";

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-4">
          <span className="font-heading font-semibold">My MapAble</span>
          <nav className="flex flex-wrap gap-3 text-sm" aria-label="Participant">
            <Link href="/participant/activity" className="hover:underline">
              Activity
            </Link>
            <Link href="/participant/data-access-history" className="hover:underline">
              Data access history
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:underline">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
