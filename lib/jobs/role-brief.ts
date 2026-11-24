import type { Prisma } from "@prisma/client";

import { organisationScopedIds } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";

export const roleBriefSkills = {
  where: { category: "skill" },
  orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  select: { id: true, label: true, description: true, isEssential: true },
} satisfies Prisma.Job$requirementsArgs;

export async function managedJobOrganisations(
  user: CurrentUser,
): Promise<Prisma.OrganisationWhereInput> {
  const ids = await organisationScopedIds(user, "jobs:manage:employer");
  return ids === "admin_unscoped" ? {} : { id: { in: ids } };
}

export async function readableJobs(
  user: CurrentUser,
): Promise<Prisma.JobWhereInput> {
  return {
    OR: [
      { status: "published" },
      { employerOrganisation: await managedJobOrganisations(user) },
      {
        status: { in: ["closed", "archived"] },
        applications: { some: { participantId: user.id } },
      },
    ],
  };
}
