import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { activateEmploymentSupportBundle } from "@/lib/modules/employment-facade";
import { requireEmploymentApi } from "@/lib/modules/module-api-auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  interviewAt: z.string().datetime().optional(),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { participantId: true },
  });
  if (!app) return jsonError("Not found", 404);

  const auth = await requireEmploymentApi({ participantId: app.participantId });
  if (auth instanceof Response) return auth;

  const { getEmploymentSupportBundle } = await import(
    "@/lib/modules/employment-facade"
  );
  const bundle = await getEmploymentSupportBundle(applicationId);
  return jsonOk(bundle);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await params;
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { participantId: true },
  });
  if (!app) return jsonError("Not found", 404);

  const auth = await requireEmploymentApi({ participantId: app.participantId });
  if (auth instanceof Response) return auth;

  let body: z.infer<typeof bodySchema> = {};
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    body = parsed.data;
  } catch {
    /* empty body ok */
  }

  const bundle = await activateEmploymentSupportBundle(
    applicationId,
    auth.user.id,
    body,
  );
  return jsonOk(bundle);
}
