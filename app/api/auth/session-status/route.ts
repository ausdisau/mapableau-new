import { getAuthSessionStatus } from "@/lib/auth/auth-session-status";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  const status = await getAuthSessionStatus();
  return jsonOk(status);
}
