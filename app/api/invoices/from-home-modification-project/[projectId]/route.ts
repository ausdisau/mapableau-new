import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { createInvoiceFromProject } from "@/lib/home-modifications/home-modification-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { projectId } = await params;

  try {
    const invoice = await createInvoiceFromProject({
      projectId,
      actorUserId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk({ invoice }, 201);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "FORBIDDEN") {
        return jsonError(accessDeniedMessage("no_permission"), 403);
      }
      if (e.message === "NOT_FOUND") {
        return jsonError(accessDeniedMessage("not_found"), 404);
      }
    }
    return jsonError("Could not create invoice", 400);
  }
}
