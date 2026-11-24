import Link from "next/link";

import { RoleBrief } from "@/components/jobs/RoleBrief";
import { requireAuth } from "@/lib/auth/guards";
import { jobsParticipationConfig } from "@/lib/config/jobs-participation";
import { readableJobs, roleBriefSkills } from "@/lib/jobs/role-brief";
import { prisma } from "@/lib/prisma";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const user = await requireAuth();
  const job = await prisma.job.findFirst({
    where: { id: jobId, ...(await readableJobs(user)) },
    include: {
      employerOrganisation: { select: { name: true } },
      requirements: jobsParticipationConfig.enabled ? roleBriefSkills : false,
    },
  });
  if (!job) return <p role="alert">Job not found.</p>;

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{job.title}</h1>
      <p className="text-sm">{job.employerOrganisation.name}</p>
      <p>{job.description}</p>
      {jobsParticipationConfig.enabled && <RoleBrief skills={job.requirements} instructions={job.applicationInstructions} />}
      {job.adjustmentOpennessStatement ? (
        <section className="rounded-lg border p-4">
          <h2 className="font-semibold">Adjustments</h2>
          <p>{job.adjustmentOpennessStatement}</p>
        </section>
      ) : null}
      {job.status === "published" ? (
        <Link
          href={`/dashboard/jobs/${job.id}/apply`}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Apply
        </Link>
      ) : null}
    </article>
  );
}
