import { redirect } from "next/navigation";

import { VerificationReviewActions } from "@/components/verification/VerificationReviewActions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { listExpiringVerificationRecords } from "@/lib/verification/verification-service";

export default async function AdminVerificationPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.primaryRole)) redirect("/dashboard");

  const [records, expiring] = await Promise.all([
    prisma.verificationRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    listExpiringVerificationRecords(30),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">Verification hub</h1>
        <p className="text-sm text-slate-600">
          Review provider, worker, driver and practitioner verification records.
          Eligibility gates fail closed.
        </p>
      </header>

      <section>
        <h2 className="font-semibold">Expiring soon</h2>
        {expiring.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No records expiring soon.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {expiring.map((record) => (
              <li key={record.id} className="rounded-md border bg-amber-50 p-3">
                <span className="font-medium capitalize">
                  {record.recordType.replace(/_/g, " ")}
                </span>
                <span className="ml-2 text-sm text-slate-700">
                  expires {record.expiryDate?.toLocaleDateString("en-AU")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Review queue</h2>
        {records.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No verification records.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {records.map((record) => (
              <li key={record.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize">
                      {record.recordType.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm capitalize text-slate-600">
                      {record.status.replace(/_/g, " ")}
                      {record.eligibilityGate
                        ? ` - ${record.eligibilityGate.replace(/_/g, " ")}`
                        : ""}
                    </p>
                  </div>
                  <VerificationReviewActions recordId={record.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
