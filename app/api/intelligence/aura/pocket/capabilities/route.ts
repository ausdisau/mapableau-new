import { jsonOk } from "@/lib/api/response";
import { detectPocketCapabilities } from "@/lib/aura/pocket/capabilities";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const platform = new URL(req.url).searchParams.get("platform");
  const caps = detectPocketCapabilities({
    platform:
      platform === "android" ||
      platform === "ios" ||
      platform === "browser" ||
      platform === "simulator"
        ? platform
        : "browser",
  });
  return jsonOk({ capabilities: caps });
}
