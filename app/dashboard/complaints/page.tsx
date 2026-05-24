import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { COMPLAINT_TYPE_LABELS, formatStatusLabel } from "@/lib/disputes/labels";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Complaints | MapAble Core" };

export default async function ComplaintsListPage() {
  const user = await requireAuth();
  const complaints = await prisma.complaint.findMany({
    where: {
      OR: [{ participantId: user.id }, { createdById: user.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Your complaints</h1>
          <p className="text-muted-foreground">
            Formal complaints about conduct, safety or service quality.
          </p>
        </div>
        <Link
          href="/dashboard/complaints/new"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground"
        >
          Make a complaint
        </Link>
      </header>
      <ul className="space-y-3">
        {complaints.map((c) => (
          <li key={c.id} className="rounded-lg border p-4">
            <Link
              href={`/dashboard/complaints/${c.id}`}
              className="font-medium text-primary underline"
            >
              {c.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {COMPLAINT_TYPE_LABELS[c.type]} · {formatStatusLabel(c.status)}
              {c.safetyEscalated ? " · Escalated for safeguarding review" : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
