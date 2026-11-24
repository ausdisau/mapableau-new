import { z, ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { jobsParticipationConfig } from "@/lib/config/jobs-participation";
import { createJobDraft } from "@/lib/jobs/job-service";
import { managedJobOrganisations, readableJobs } from "@/lib/jobs/role-brief";
import { prisma } from "@/lib/prisma";
import { createJobSchema } from "@/lib/validation/jobs";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const status = z.enum(["published", "draft", "closed", "archived"])
    .safeParse(new URL(req.url).searchParams.get("status") ?? "published");
  if (!status.success) return jsonError("Unknown job status", 400);
  const jobs = await prisma.job.findMany({
    where: { status: status.data, ...(status.data === "published" ? {} : await readableJobs(user)) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ jobs });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("jobs:manage:employer");
  if (user instanceof Response) return user;
  try {
    const parsed = createJobSchema.parse(await req.json());
    if (parsed.skills?.length && !jobsParticipationConfig.enabled) {
      return jsonError("Skills are unavailable in this environment.", 403);
    }
    const organisation = await prisma.organisation.findFirst({
      where: { id: parsed.employerOrganisationId, status: "active", AND: await managedJobOrganisations(user) },
      select: { id: true },
    });
    if (!organisation) return jsonError("Choose an active organisation you manage.", 403);
    const job = await createJobDraft({
      ...parsed,
      createdById: user.id,
    });
    return jsonOk({ job }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Create failed", 500);
  }
}
