import { fedError, fedJson } from "@/lib/api/federation-response";
import { isFederationActivated } from "@/lib/credentials/issuance";
import { refuseProductionPresentation, buildVpProfile } from "@/lib/federation-conformance/oid4vp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isFederationActivated()) {
    return fedError("not_configured", 501, {
      hint: "OID4VP presentation is simulator-only. Set FEDERATION_ACTIVATION=true and pass conformance.",
    });
  }
  try {
    refuseProductionPresentation("api.federation.presentation");
  } catch (err) {
    return fedError(err instanceof Error ? err.message : "refused", 403);
  }
  return fedJson({ status: "simulator_only", body }, 202);
}

export async function GET() {
  return fedJson(buildVpProfile());
}
