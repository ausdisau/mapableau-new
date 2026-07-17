import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AssuranceTestsPage() {
  await requireAdmin();
  const tests = await prisma.assuranceControlTest.findMany({
    include: {
      control: { select: { controlCode: true, title: true } },
      runs: { orderBy: { executedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Control tests</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Failed, blocked, partial, or not-run tests block readiness. Test results are
        not certification.
      </p>
      {tests.length === 0 ? (
        <p>No control tests defined yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4">
                Test
              </th>
              <th scope="col" className="py-2 pr-4">
                Control
              </th>
              <th scope="col" className="py-2 pr-4">
                Kind
              </th>
              <th scope="col" className="py-2">
                Latest result
              </th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr key={test.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{test.name}</td>
                <td className="py-2 pr-4">
                  {test.control.controlCode} — {test.control.title}
                </td>
                <td className="py-2 pr-4">{test.kind}</td>
                <td className="py-2">
                  {test.runs[0]?.result ?? "not_run"}
                  {test.runs[0]?.blocksReadiness ? " (blocks readiness)" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
