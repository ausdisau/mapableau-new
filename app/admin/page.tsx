import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AuditEventTable } from "@/components/admin/AuditEventTable";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin | MapAble Core" };

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    participantProfiles,
    organisationsPendingReview,
    bookingsRequested,
    consentRecords,
    recentAuditEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.participantProfile.count(),
    prisma.organisation.count({
      where: { verificationStatus: "pending_review" },
    }),
    prisma.booking.count({ where: { status: "requested" } }),
    prisma.consentRecord.count({ where: { status: "active" } }),
    prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actorUser: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold">MapAble admin</h1>
        <p className="text-muted-foreground">
          Platform spine overview. All sensitive access is audit logged.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminMetricCard title="Total users" value={totalUsers} href="/admin/participants" />
        <AdminMetricCard
          title="Participant profiles"
          value={participantProfiles}
          href="/admin/participants"
        />
        <AdminMetricCard
          title="Organisations pending review"
          value={organisationsPendingReview}
          href="/admin/organisations"
        />
        <AdminMetricCard
          title="Bookings requested"
          value={bookingsRequested}
          href="/admin/bookings"
        />
        <AdminMetricCard
          title="Active consent records"
          value={consentRecords}
          href="/admin/consents"
        />
        <AdminMetricCard
          title="System alerts"
          value={0}
          description="Placeholder for Phase 2"
        />
      </div>

      <section>
        <h2 className="font-semibold">Recent audit events</h2>
        <div className="mt-4">
          <AuditEventTable
            events={recentAuditEvents.map((e) => ({
              ...e,
              createdAt: e.createdAt,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
