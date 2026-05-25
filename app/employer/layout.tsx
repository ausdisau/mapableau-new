import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="min-h-screen">
      <nav className="border-b bg-card px-4 py-3" aria-label="Employer">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4">
          <Link href="/employer/jobs">Jobs</Link>
          <Link href="/employer/applications">Applications</Link>
          <Link href="/employer/calendar">Calendar</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
