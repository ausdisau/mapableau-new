import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isPlatformAssuranceEnabled } from "@/lib/config/platform-assurance";
import { listRegulatorySources } from "@/lib/platform-assurance";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isPlatformAssuranceEnabled()) {
    return jsonError("PLATFORM_ASSURANCE_DISABLED", 403);
  }

  const sources = await listRegulatorySources();
  return jsonOk({
    sources,
    note: "Draft, guidance, and candidate sources must not be treated as enacted law.",
  });
}
