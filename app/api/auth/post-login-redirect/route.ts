import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";
import { resolvePostLoginPathForUser } from "@/lib/workers/profile-completion";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const redirectTo = await resolvePostLoginPathForUser(
    user.id,
    user.primaryRole
  );

  return jsonOk({
    redirectTo: isSafeRedirect(redirectTo) ? redirectTo : "/dashboard",
  });
}
