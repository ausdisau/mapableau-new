import { prisma } from "@/lib/prisma";

export async function getTeamTrainingProgress(organisationId: string) {
  const members = await prisma.organisationMember.findMany({
    where: { organisationId },
    include: {
      user: {
        include: {
          academyEnrolments: {
            include: { course: true, certificate: true },
          },
        },
      },
    },
  });

  const requirements = await prisma.workerTrainingRequirement.findMany({
    where: { organisationId, active: true },
    include: { course: true },
  });

  return { members, requirements };
}
