import { notFound } from "next/navigation";

import { EmploymentSupportBundlePanel } from "@/components/employment/EmploymentSupportBundlePanel";
import { PlainLanguageStatusBadge } from "@/components/modules/PlainLanguageStatusBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { JOB_APPLICATION_STATUS_LABELS } from "@/types/employment";

export default async function JobApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const user = await requireAuth();
  const { applicationId } = await params;

  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, participantId: user.id },
    include: { job: true },
  });
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{app.job.title}</h1>
        <PlainLanguageStatusBadge
          label={JOB_APPLICATION_STATUS_LABELS[app.status] ?? app.status}
        />
      </header>
      {(app.transportSupportNeeded || app.careSupportNeeded) && (
        <EmploymentSupportBundlePanel applicationId={app.id} />
      )}
    </div>
  );
}
