import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export default async function ServiceRecoveryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const cases = await prisma.serviceRecoveryCase.findMany({
    where: isAdminRole(user.primaryRole)
      ? {}
      : { OR: [{ participantId: user.id }, { createdById: user.id }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { backupOptions: true },
  });

  return (
    <PageContainer title="Service recovery">
      <p className="mb-6 text-sm text-slate-600">
        When support falls through, MapAble helps find safe next steps. Backup
        options are never auto-assigned.
      </p>

      {cases.length === 0 ? (
        <p role="status" className="text-slate-600">
          No recovery cases yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {cases.map((recoveryCase) => (
            <li key={recoveryCase.id}>
              <Link
                href={`/service-recovery/${recoveryCase.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{recoveryCase.summary}</span>
                  <span className="text-sm capitalize text-slate-700">
                    {recoveryCase.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 capitalize">
                  {recoveryCase.trigger.replace(/_/g, " ")}
                  {recoveryCase.backupOptions.length
                    ? ` - ${recoveryCase.backupOptions.length} backup option(s)`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
