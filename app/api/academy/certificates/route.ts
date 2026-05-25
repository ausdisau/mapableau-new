import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listUserCertificates } from "@/lib/academy/quiz-service";

export async function GET() {
  const user = await requireApiPermission("academy:read");
  if (user instanceof Response) return user;
  const certificates = await listUserCertificates(user.id);
  return jsonOk({ certificates });
}
