import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  return jsonOk({
    id: user.id,
    email: user.email,
    name: user.name,
    primaryRole: user.primaryRole,
    roles: user.roles,
  });
}
