import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function Registration0137Page() {
  await requireAdmin();
  const applications = await prisma.ndisRegistrationApplication.findMany({
    where: { includes0137: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance/registration">
          Back to registration
        </Link>{" "}
        ·{" "}
        <Link className="underline" href="/admin/assurance">
          Assurance home
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Registration group 0137</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Including 0137 in an application does not mean MapAble is registered as an NDIS
        digital platform provider. Registration status is not platform approval.
      </p>
      {applications.length === 0 ? (
        <p>No 0137 registration applications recorded.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4">
                Pathway
              </th>
              <th scope="col" className="py-2 pr-4">
                Status
              </th>
              <th scope="col" className="py-2 pr-4">
                Groups
              </th>
              <th scope="col" className="py-2">
                Readiness
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{app.pathway}</td>
                <td className="py-2 pr-4">{app.status}</td>
                <td className="py-2 pr-4">{app.registrationGroups.join(", ")}</td>
                <td className="py-2">{app.readinessDecision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
