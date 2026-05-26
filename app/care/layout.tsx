import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("care:read:self");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4"
          aria-label="Care navigation"
        >
          <Link href="/care" className="font-heading font-bold">
            MapAble Care
          </Link>
          <Link href="/care/request" className="text-sm underline">
            Request care
          </Link>
          <Link href="/care/bookings" className="text-sm underline">
            Bookings
          </Link>
          <Link href="/care/shifts" className="text-sm underline">
            Shifts
          </Link>
          <Link href="/care/service-logs" className="text-sm underline">
            Service logs
          </Link>
          <Link href="/care/find" className="text-sm underline">
            Find providers
          </Link>
          <Link href="/care/support" className="text-sm underline">
            Care &amp; support
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
