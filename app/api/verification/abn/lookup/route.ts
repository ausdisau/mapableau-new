import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { AbnLookupError, lookupAbn } from "@/lib/abn-lookup";
import { abnLookupBodySchema } from "@/lib/validation/verification";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isAdminRole(user.primaryRole)) {
    const permitted = await requireApiPermission("verification:manage:org");
    if (permitted instanceof Response) return permitted;
  }

  const body = await req.json();
  const parsed = abnLookupBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  try {
    const result = await lookupAbn(parsed.data.abn);
    return jsonOk({ lookup: result });
  } catch (e) {
    if (e instanceof AbnLookupError) {
      return jsonError(e.message, 400);
    }
    throw e;
  }
}
