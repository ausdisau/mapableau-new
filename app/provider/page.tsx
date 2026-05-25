import Link from "next/link";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProviderOrganisationForUser } from "@/lib/providers/provider-org-profile-service";
import { prisma } from "@/lib/prisma";

export default async function ProviderDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/provider");

  const membership = await getProviderOrganisationForUser(user.id);
  if (!membership) redirect("/onboarding/role");

  const [pendingBookings, openTickets] = await Promise.all([
    prisma.booking.count({
      where: {
        assignedOrganisationId: membership.organisationId,
        status: { in: ["requested", "provider_review"] },
      },
    }),
    prisma.supportTicket.count({
      where: { createdById: user.id, status: { not: "closed" } },
    }).catch(() => 0),
  ]);

  const profile = membership.organisation.organisationProfile;
  const eligibility = profile?.bookingEligibilityStatus ?? "not_eligible";

  return (
    <PageContainer title="Provider home">
      <p className="text-slate-700 mb-4" role="status">
        {membership.organisation.name} — booking eligibility:{" "}
        <strong>{eligibility.replace(/_/g, " ")}</strong>
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        <li className="rounded-lg border bg-white p-4">
          <h2 className="font-medium">Booking requests</h2>
          <p className="text-2xl font-semibold mt-1">{pendingBookings}</p>
          <Link href="/provider/bookings" className="text-sm text-blue-800 font-medium">
            Open inbox
          </Link>
        </li>
        <li className="rounded-lg border bg-white p-4">
          <h2 className="font-medium">Profile</h2>
          <Link href="/provider/profile" className="text-sm text-blue-800 font-medium">
            Edit organisation profile
          </Link>
        </li>
      </ul>
    </PageContainer>
  );
}
