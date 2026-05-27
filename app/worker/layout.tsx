import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("care:shift:work");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4"
          aria-label="Worker navigation"
        >
          <span className="font-heading font-bold">Worker</span>
          <Link href="/worker/today" className="text-sm underline">
            Today
          </Link>
          <Link href="/worker/service-log" className="text-sm underline">
            Service log
          </Link>
          <Link href="/worker/report-issue" className="text-sm underline">
            Report issue
          </Link>
          <Link href="/worker/profile" className="text-sm underline">
            Profile
          </Link>
          <Link href="/worker/onboarding" className="text-sm underline">
            Onboarding
          </Link>
          <Link href="/dashboard" className="ml-auto text-sm text-muted-foreground">
            Dashboard
          </Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
