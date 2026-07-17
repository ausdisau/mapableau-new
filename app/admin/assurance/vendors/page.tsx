import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AssuranceVendorsPage() {
  await requireAdmin();
  const vendors = await prisma.vendorRiskAssessment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Vendor risk assessments</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Vendor risk records support due diligence — they do not replace contractual
        review or certification.
      </p>
      {vendors.length === 0 ? (
        <p>No vendor risk assessments recorded.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4">
                Vendor
              </th>
              <th scope="col" className="py-2 pr-4">
                Risk level
              </th>
              <th scope="col" className="py-2 pr-4">
                Residual
              </th>
              <th scope="col" className="py-2">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{vendor.vendor}</td>
                <td className="py-2 pr-4">{vendor.riskLevel}</td>
                <td className="py-2 pr-4">{vendor.residualRiskLevel ?? "—"}</td>
                <td className="py-2">{vendor.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
