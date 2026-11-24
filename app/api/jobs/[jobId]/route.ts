import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { jobsParticipationConfig } from "@/lib/config/jobs-participation";
import { listEmployerEvidence } from "@/lib/jobs/evidence/employer-evidence-service";
import { managedJobOrganisations, readableJobs } from "@/lib/jobs/role-brief";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { jobId } = await params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, ...(await readableJobs(user)) },
    include: {
      employerOrganisation: { select: { id: true, name: true } },
      requirements: jobsParticipationConfig.enabled
        ? { orderBy: { sortOrder: "asc" } }
        : false,
      workplaceLocation: jobsParticipationConfig.enabled
        ? { include: { evidence: true } }
        : false,
    },
  });
  if (!job) return jsonError("Not found", 404);

  const payload: Record<string, unknown> = { job };
  if (jobsParticipationConfig.enabled) {
    payload.accessibilityEvidence = await listEmployerEvidence(
      job.employerOrganisationId,
    );
  }

  return jsonOk(payload);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiPermission("jobs:manage:employer");
  if (user instanceof Response) return user;
  const { jobId } = await params;
  const body = await req.json();
  const [job] = await prisma.job.updateManyAndReturn({
    where: { id: jobId, employerOrganisation: await managedJobOrganisations(user) },
    data: {
      title: body.title,
      description: body.description,
      accessibilityFeatures: body.accessibilityFeatures,
    },
  });
  return job ? jsonOk({ job }) : jsonError("Not found", 404);
}
