import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listTripsForUser } from "@/lib/transport-mvp/access-control";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const trips = await listTripsForUser(user);
  return jsonOk({ trips });
}
