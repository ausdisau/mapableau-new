import { mapableGoFlags, goFeatureDisabledResponse } from "@/lib/config/mapable-go";
import { barrierReportSchema } from "@/lib/go/contracts/route-contracts";
import { listActiveBarriers, reportBarrier } from "@/lib/go/barrier-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function GET() {
  if (!mapableGoFlags.enabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const barriers = await listActiveBarriers();
  return jsonOk({
    enabled: mapableGoFlags.dynamicBarriersEnabled,
    barriers: barriers.map((b) => ({
      id: b.id,
      segmentId: b.segmentExternalId,
      type: b.type,
      reportedAt: b.reportedAt.toISOString(),
      expiresAt: b.expiresAt?.toISOString() ?? null,
      verificationState: b.verificationState,
      description: b.description,
    })),
  });
}

export async function POST(req: Request) {
  if (!mapableGoFlags.enabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = barrierReportSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const barrier = await reportBarrier({
      userId: user.id,
      segmentId: parsed.data.segmentId,
      type: parsed.data.type,
      description: parsed.data.description,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    });
    return jsonOk(
      {
        id: barrier.id,
        segmentId: barrier.segmentExternalId,
        verificationState: barrier.verificationState,
        expiresAt: barrier.expiresAt?.toISOString(),
      },
      201,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Barrier report failed";
    return Response.json({ error: message }, { status: 403 });
  }
}
