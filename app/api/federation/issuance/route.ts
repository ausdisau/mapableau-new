import { fedError, fedJson } from "@/lib/api/federation-response";
import { isFederationActivated } from "@/lib/credentials/issuance";
import { refuseProductionIssuance } from "@/lib/federation-conformance/oid4vci";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isFederationActivated()) {
    return fedError("not_configured", 501, {
      hint: "OID4VCI issuance is simulator-only. Set FEDERATION_ACTIVATION=true and pass conformance.",
    });
  }
  try {
    refuseProductionIssuance("api.federation.issuance");
  } catch (err) {
    return fedError(err instanceof Error ? err.message : "refused", 403);
  }
  return fedJson({ status: "simulator_only", body }, 202);
}

export async function GET() {
  return fedJson({
    profile: "simulator_only",
    disclaimer:
      "MapAble does not issue government credentials. Live issuance requires operator activation and conformance.",
  });
}
