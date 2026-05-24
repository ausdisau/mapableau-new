import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { formatStatusLabel } from "@/lib/disputes/labels";
import { listDisputesForUser } from "@/lib/disputes/dispute-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Disputes & complaints | Admin" };

export default async function AdminDisputesPage() {
  await requireAdmin();

  const [disputes, complaints] = await Promise.all([
    listDisputesForUser({ userId: "", isAdmin: true }),
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { participant: { select: { name: true } } },
    }),
  ]);

  const openDisputes = disputes.filter(
    (d) => !["closed", "resolved", "withdrawn"].includes(d.status)
  );
  const openComplaints = complaints.filter(
    (c) => !["closed", "resolved"].includes(c.status)
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Disputes and complaints</h1>
        <p className="text-muted-foreground">
          Operational queue for participant disputes and formal complaints.
        </p>
      </header>

      <section aria-labelledby="open-disputes-heading">
        <h2 id="open-disputes-heading" className="font-heading text-lg font-semibold">
          Open disputes ({openDisputes.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {openDisputes.map((d) => (
            <li key={d.id} className="rounded-lg border p-3 text-sm">
              <Link
                href={`/dashboard/disputes/${d.id}`}
                className="font-medium text-primary underline"
              >
                {d.title}
              </Link>
              <span className="ml-2 text-muted-foreground">
                {formatStatusLabel(d.status)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="open-complaints-heading">
        <h2 id="open-complaints-heading" className="font-heading text-lg font-semibold">
          Open complaints ({openComplaints.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {openComplaints.map((c) => (
            <li key={c.id} className="rounded-lg border p-3 text-sm">
              <Link
                href={`/dashboard/complaints/${c.id}`}
                className="font-medium text-primary underline"
              >
                {c.title}
              </Link>
              <span className="ml-2 text-muted-foreground">
                {formatStatusLabel(c.status)}
                {c.safetyEscalated ? " · safety escalated" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
