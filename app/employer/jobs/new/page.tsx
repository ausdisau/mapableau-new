import Link from "next/link";

import { NewJobForm } from "@/components/jobs/NewJobForm";
import { requirePermission } from "@/lib/auth/guards";
import { jobsParticipationConfig } from "@/lib/config/jobs-participation";
import { managedJobOrganisations } from "@/lib/jobs/role-brief";
import { prisma } from "@/lib/prisma";

export default async function EmployerNewJobPage() {
  const user = await requirePermission("jobs:manage:employer");
  const organisations = await prisma.organisation.findMany({
    where: { ...(await managedJobOrganisations(user)), status: "active" },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
  if (organisations.length === 0) {
    return (
      <section className="space-y-3">
        <h1 className="font-heading text-2xl font-bold">
          Create a job listing
        </h1>
        <p>You need access to an active organisation to create a draft.</p>
        <Link
          className="inline-flex min-h-11 items-center underline"
          href="/contact"
        >
          Ask MapAble for help
        </Link>
      </section>
    );
  }
  return (
    <NewJobForm
      organisations={organisations}
      skillsEnabled={jobsParticipationConfig.enabled}
    />
  );
}
