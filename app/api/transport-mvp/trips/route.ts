import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listTripsForUser } from "@/lib/transport-mvp/access-control";

export async function GET() {
  const sessionUser = await requireApiSession();
  if (sessionUser instanceof Response) return sessionUser;
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const trips = await listTripsForUser(user);
  return jsonOk({ trips });
}
