import Link from "next/link";
import { redirect } from "next/navigation";

import { RoleAwareDashboard } from "@/components/core/RoleAwareDashboard";
import { requireAuth } from "@/lib/auth/guards";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { countUnreadNotifications } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard | MapAble Core" };

export default async function DashboardPage() {
  const user = await requireAuth();

  if (
    user.primaryRole !== "participant" &&
    user.primaryRole !== "family_member"
  ) {
    redirect(defaultDashboardPath(user.primaryRole));
  }

  const [profile, unreadNotifications] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { userId: user.id } }),
    countUnreadNotifications(user.id),
  ]);

  const displayName = profile?.displayName ?? user.name ?? "there";

  return (
    <div className="space-y-8">
      <RoleAwareDashboard
        displayName={displayName}
        email={user.email ?? ""}
        role={user.primaryRole}
        unreadNotifications={unreadNotifications}
      />
      <section aria-labelledby="more-links-heading">
        <h2 id="more-links-heading" className="font-heading text-xl font-semibold">
          More
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Accessibility"
            description="Your access needs travel with you across MapAble services"
            href="/dashboard/accessibility"
          />
          <DashboardCard
            title="Consent"
            description="Control who can see your information"
            href="/dashboard/consent"
          />
          <DashboardCard
            title="Messages"
            description="Secure conversations with your providers"
            href="/dashboard/messages"
          />
        </ul>
      </section>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-block text-sm font-medium text-primary">
        Open →
      </span>
    </Link>
  );
}
