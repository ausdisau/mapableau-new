import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function TransportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("transport:read:self");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4"
          aria-label="Transport navigation"
        >
          <Link href="/transport" className="font-heading font-bold">
            MapAble Transport
          </Link>
          <Link href="/dashboard/transport/new" className="text-sm underline">
            New trip
          </Link>
          <Link href="/dashboard/transport" className="text-sm underline">
            My trips
          </Link>
          <Link href="/dashboard/find-transport" className="text-sm underline">
            Find operators
          </Link>
          <Link href="/dashboard/transport/legacy" className="text-sm underline">
            Legacy bookings
          </Link>
          <Link href="/driver/trips" className="text-sm underline">
            Driver view
          </Link>
          <Link href="/dashboard" className="ml-auto text-sm text-muted-foreground">
            Dashboard
          </Link>
          <Link href="/core" className="text-sm text-muted-foreground">
            MapAble Core
          </Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
