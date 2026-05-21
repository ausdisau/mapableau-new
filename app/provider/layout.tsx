import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="min-h-screen">
      <nav className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4">
          <Link href="/provider/bookings">Bookings</Link>
          <Link href="/provider/care">Care</Link>
          <Link href="/provider/care/shifts">Care shifts</Link>
          <Link href="/provider/transport">Transport</Link>
          <Link href="/provider/workers">Workers</Link>
          <Link href="/provider/availability">Availability</Link>
          <Link href="/provider/calendar">Calendar</Link>
          <Link href="/provider/messages">Messages</Link>
          <Link href="/provider/support">Support</Link>
          <Link href="/provider/documents">Documents</Link>
          <Link href="/provider/invoices">Invoices</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
