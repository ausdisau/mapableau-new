import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { deleteEmergencyContact } from "@/lib/emergency/contact-service";

type Params = { params: Promise<{ contactId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireApiPermission("emergency:manage:self");
  if (user instanceof Response) return user;
  const { contactId } = await params;
  try {
    await deleteEmergencyContact(contactId, user.id, user.id);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Delete failed", 500);
  }
}
