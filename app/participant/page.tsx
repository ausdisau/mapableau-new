import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireParticipantAccess } from "@/lib/access/platform-access";

export default async function ParticipantDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/participant");

  try {
    await requireParticipantAccess(user, user.id);
  } catch {
    redirect("/login");
  }

  if (
    user.primaryRole !== "participant" &&
    user.primaryRole !== "family_member"
  ) {
    redirect("/dashboard");
  }

  return (
    <AppShell userName={user.name} role={user.primaryRole}>
      <PageContainer title="Home">
        <p className="text-slate-700">
          Welcome back. Use Find to search providers, Bookings for upcoming
          supports, and Messages to stay in touch.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-medium">Find support</h2>
            <p className="text-sm text-slate-600 mt-1">Search verified providers near you.</p>
            <a href="/providers" className="text-blue-800 text-sm font-medium mt-2 inline-block">
              Open provider finder
            </a>
          </li>
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-medium">Bookings</h2>
            <p className="text-sm text-slate-600 mt-1">No upcoming bookings yet.</p>
            <a href="/bookings" className="text-blue-800 text-sm font-medium mt-2 inline-block">
              View bookings
            </a>
          </li>
        </ul>
      </PageContainer>
    </AppShell>
  );
}
