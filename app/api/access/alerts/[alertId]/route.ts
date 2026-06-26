import { resolveAccessAlert } from "@/lib/access-alerts/access-alert-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { alertId } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string | undefined;

  const alert = await prisma.accessAlert.findUnique({
    where: { id: alertId },
  });
  if (!alert) return jsonError("Alert not found", 404);

  if (action === "resolve") {
    const updated = await resolveAccessAlert({
      alertId,
      resolvedById: user.id,
    });
    return jsonOk({ alert: updated });
  }

  return jsonError("Unsupported action", 400);
}
