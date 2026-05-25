import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { RecoveryActionPanel } from "@/components/service-recovery/RecoveryActionPanel";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export default async function ServiceRecoveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id } = await params;

  const recoveryCase = await prisma.serviceRecoveryCase.findUnique({
    where: { id },
    include: {
      backupOptions: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      escalations: true,
    },
  });
  if (!recoveryCase) notFound();
  if (
    !isAdminRole(user.primaryRole) &&
    recoveryCase.participantId !== user.id &&
    recoveryCase.createdById !== user.id
  ) {
    notFound();
  }

  return (
    <PageContainer title="Recovery case">
      <Link
        href="/service-recovery"
        className="mb-4 inline-block text-sm font-medium text-blue-800"
      >
        Back to service recovery
      </Link>
      <p className="mb-2 text-slate-800">{recoveryCase.summary}</p>
      <p className="mb-6 text-sm capitalize text-slate-600">
        {recoveryCase.trigger.replace(/_/g, " ")} -{" "}
        {recoveryCase.status.replace(/_/g, " ")}
      </p>

      <RecoveryActionPanel
        recoveryCaseId={recoveryCase.id}
        backupOptions={recoveryCase.backupOptions.map((option) => ({
          id: option.id,
          providerName: option.providerName,
          safeToOffer: option.safeToOffer,
        }))}
        canManage={isAdminRole(user.primaryRole)}
      />

      <section className="mt-8">
        <h2 className="font-semibold">Timeline</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {recoveryCase.events.map((event) => (
            <li key={event.id} className="rounded-md border bg-white p-3">
              <span className="font-medium capitalize">
                {event.eventType.replace(/_/g, " ")}
              </span>{" "}
              <span className="text-slate-600">
                {new Date(event.createdAt).toLocaleString("en-AU")}
              </span>
              {event.note ? <p>{event.note}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}
