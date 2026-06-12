import { AuditTrailPanel } from "@/components/abilitypay/AuditTrailPanel";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AbilityPayAuditPage() {
  await requirePermission("abilitypay:audit:read");

  const events = await prisma.auditEvent.findMany({
    where: { action: { startsWith: "abilitypay." } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actorUser: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Audit</h1>
        <p className="text-muted-foreground">
          Activity log for plan managers and administrators.
        </p>
      </header>
      <AuditTrailPanel events={events} />
    </div>
  );
}
