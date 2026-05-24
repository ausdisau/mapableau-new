import Link from "next/link";

import { PlainLanguageStatusBadge } from "@/components/modules/PlainLanguageStatusBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { JOB_APPLICATION_STATUS_LABELS } from "@/types/employment";

export const metadata = { title: "My applications | MapAble" };

export default async function MyJobApplicationsPage() {
  const user = await requireAuth();

  const applications = await prisma.jobApplication.findMany({
    where: { participantId: user.id },
    include: { job: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">My applications</h1>
        <Link href="/dashboard/jobs" className="text-sm text-primary hover:underline">
          Browse jobs
        </Link>
      </header>
      <ul className="space-y-4">
        {applications.map((app) => (
          <li key={app.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/dashboard/jobs/applications/${app.id}`}
                className="font-semibold hover:text-primary"
              >
                {app.job.title}
              </Link>
              <PlainLanguageStatusBadge
                label={
                  JOB_APPLICATION_STATUS_LABELS[app.status] ?? app.status
                }
              />
            </div>
            {app.transportSupportNeeded || app.careSupportNeeded ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Support requested:
                {app.transportSupportNeeded ? " transport" : ""}
                {app.careSupportNeeded ? " care" : ""}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
