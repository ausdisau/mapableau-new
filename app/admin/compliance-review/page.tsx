import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ComplianceReviewAdminPage() {
  await requirePermission("admin:dashboard");

  const runs = await prisma.complianceReviewRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { findings: true },
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Compliance review AI</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Draft findings only — not legal, clinical or audit certification. A human must
        confirm each finding.
      </p>
      <Link href="/admin/compliance-review/new" className="text-primary underline">
        Start new review
      </Link>
      <ul className="space-y-3">
        {runs.map((r) => (
          <li key={r.id} className="rounded border p-3">
            <Link href={`/admin/compliance-review/${r.id}`} className="font-medium underline">
              {r.checklistId} — {r.status}
            </Link>
            <p className="text-xs text-muted-foreground">
              {r.findings.length} finding(s)
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
