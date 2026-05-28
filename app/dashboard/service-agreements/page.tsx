import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ParticipantServiceAgreementsPage() {
  const user = await requirePermission("agreement:read:self");
  const agreements = await prisma.serviceAgreement.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Service agreements</h1>
        <p className="text-sm text-muted-foreground">
          Review, sign, and track your care/transport service agreements.
        </p>
      </header>

      {agreements.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          No service agreements yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {agreements.map((agreement) => (
            <li key={agreement.id}>
              <Link
                href={`/dashboard/service-agreements/${agreement.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40"
              >
                <p className="font-medium">{agreement.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {agreement.agreementType.replace(/_/g, " ")} · {agreement.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
