import Link from "next/link";

import { RoleBrief } from "@/components/jobs/RoleBrief";
import { requirePermission } from "@/lib/auth/guards";
import { jobsParticipationConfig } from "@/lib/config/jobs-participation";
import { managedJobOrganisations, roleBriefSkills } from "@/lib/jobs/role-brief";
import { prisma } from "@/lib/prisma";

export default async function EmployerJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const user = await requirePermission("jobs:manage:employer");
  const { jobId } = await params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, employerOrganisation: await managedJobOrganisations(user) },
    include: { requirements: jobsParticipationConfig.enabled ? roleBriefSkills : false },
  });
  if (!job) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{job.title}</h1>
      <p>Status: {job.status}</p>
      <p>{job.description}</p>
      {jobsParticipationConfig.enabled && <RoleBrief skills={job.requirements} instructions={job.applicationInstructions} />}
      <Link href="/employer/applications" className="text-primary underline">
        View applications
      </Link>
    </div>
  );
}
