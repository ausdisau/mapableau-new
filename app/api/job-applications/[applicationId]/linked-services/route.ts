import { jsonError, jsonOk } from "@/lib/api/response";
import { getEmploymentSupportBundle } from "@/lib/modules/employment-facade";
import { requireEmploymentApi } from "@/lib/modules/module-api-auth";
import { prisma } from "@/lib/prisma";

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

  const bundle = await getEmploymentSupportBundle(applicationId);
  return jsonOk(bundle);
}
