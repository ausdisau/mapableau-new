import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { createEmploymentSupportBundle } from "@/lib/modules/employment-facade";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;

  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { participantId: true },
  });
  if (!app) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && app.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const bundle = await createEmploymentSupportBundle(applicationId, user.id);
  if ("skipped" in bundle && bundle.skipped) {
    return jsonError(bundle.reason ?? "Support bundle skipped", 400);
  }
  return jsonOk(
    { bundle },
    "duplicate" in bundle && bundle.duplicate ? 200 : 201,
  );
}
