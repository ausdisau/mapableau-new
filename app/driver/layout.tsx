import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3">
        <h1 className="font-heading text-lg font-bold">MapAble Driver</h1>
        <nav className="mt-2 flex gap-4 text-sm" aria-label="Driver">
          <Link href="/driver/trips" className="min-h-11 inline-flex items-center">
            Trips
          </Link>
          <Link href="/driver/profile" className="min-h-11 inline-flex items-center">
            Profile
          </Link>
        </nav>
      </header>
      <main className="px-4 py-4">{children}</main>
    </div>
  );
}
