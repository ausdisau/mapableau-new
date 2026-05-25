import { VerificationRecordForm } from "@/components/verification/VerificationRecordForm";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProviderOrganisationForUser } from "@/lib/providers/provider-org-profile-service";
import { prisma } from "@/lib/prisma";

export default async function ProviderVerificationPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const membership = await getProviderOrganisationForUser(user.id);
  if (!membership) {
    return <p role="status">No provider organisation is linked to this account.</p>;
  }

  const records = await prisma.verificationRecord.findMany({
    where: { organisationId: membership.organisationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Verification</h1>
        <p className="text-sm text-slate-600">
          Verification controls booking eligibility. Documents remain private by
          default and require admin review.
        </p>
      </header>

      <VerificationRecordForm />

      <section>
        <h2 className="font-semibold">Records</h2>
        {records.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No records yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {records.map((record) => (
              <li key={record.id} className="rounded-lg border bg-white p-3">
                <span className="font-medium capitalize">
                  {record.recordType.replace(/_/g, " ")}
                </span>
                <span className="ml-2 text-sm capitalize text-slate-600">
                  {record.status.replace(/_/g, " ")}
                </span>
                {record.expiryDate ? (
                  <p className="text-sm text-slate-600">
                    Expires {record.expiryDate.toLocaleDateString("en-AU")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
