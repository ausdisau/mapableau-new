import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AssuranceFindingsPage() {
  await requireAdmin();
  const findings = await prisma.securityFinding.findMany({
    orderBy: [{ severity: "asc" }, { discoveredAt: "desc" }],
    take: 100,
    include: {
      control: { select: { controlCode: true } },
    },
  });

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Security findings</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Open critical findings block assurance readiness. Recording a finding is not a
        certification claim.
      </p>
      {findings.length === 0 ? (
        <p>No security findings recorded.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4">
                Title
              </th>
              <th scope="col" className="py-2 pr-4">
                Severity
              </th>
              <th scope="col" className="py-2 pr-4">
                Status
              </th>
              <th scope="col" className="py-2">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {findings.map((finding) => (
              <tr key={finding.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{finding.title}</td>
                <td className="py-2 pr-4">{finding.severity}</td>
                <td className="py-2 pr-4">{finding.status}</td>
                <td className="py-2">
                  {finding.source}
                  {finding.control ? ` · ${finding.control.controlCode}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
