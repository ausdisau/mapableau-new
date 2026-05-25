import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getProviderOrganisationForUser } from "@/lib/providers/provider-org-profile-service";
import { prisma } from "@/lib/prisma";

export default async function ProviderServiceRecoveryPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const membership = await getProviderOrganisationForUser(user.id);
  if (!membership) {
    return <p role="status">No provider organisation is linked to this account.</p>;
  }

  const cases = await prisma.serviceRecoveryCase.findMany({
    where: { organisationId: membership.organisationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Service recovery</h1>
        <p className="text-sm text-slate-600">
          Cases linked to your organisation. Participant choice is required for
          backup supports.
        </p>
      </header>

      {cases.length === 0 ? (
        <p role="status">No recovery cases.</p>
      ) : (
        <ul className="space-y-2">
          {cases.map((recoveryCase) => (
            <li key={recoveryCase.id}>
              <Link
                href={`/service-recovery/${recoveryCase.id}`}
                className="block rounded-lg border bg-white p-4"
              >
                <span className="font-medium">{recoveryCase.summary}</span>
                <span className="ml-2 text-sm capitalize text-slate-600">
                  {recoveryCase.status.replace(/_/g, " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
