import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  buildRecoveryProposal,
  renderOfflineVisitPack,
  runVisitPreflight,
  type DisruptionType,
  type PreflightContext,
} from "@/lib/access-intelligence/journey";
import type { VisitPlan } from "@/lib/access-intelligence/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "preflight");
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;

  if (action === "preflight") {
    if (!accessIntelligenceFlags.journeyPreflight) {
      return Response.json({ error: "Feature disabled" }, { status: 403 });
    }
    const ctx = body as PreflightContext;
    if (!ctx.visitPlan) {
      return Response.json({ error: "visitPlan required" }, { status: 400 });
    }
    return Response.json({ ok: true, result: runVisitPreflight(ctx) });
  }

  if (action === "recover") {
    if (!accessIntelligenceFlags.journeyGuardian) {
      return Response.json({ error: "Feature disabled" }, { status: 403 });
    }
    const proposal = buildRecoveryProposal({
      disruptionType: (body.disruptionType ?? "lift_outage") as DisruptionType,
      originalPlan: body.visitPlan as VisitPlan,
      revisedRouteSummary: body.revisedRouteSummary ?? {
        distanceDeltaMetres: 120,
        timeDeltaMinutes: 8,
        confidenceDelta: -0.05,
      },
    });
    return Response.json({ ok: true, proposal, requiresApproval: true });
  }

  if (action === "offline_pack") {
    if (!accessIntelligenceFlags.offlineVisitPack) {
      return Response.json({ error: "Feature disabled" }, { status: 403 });
    }
    const pack = renderOfflineVisitPack({
      visitPlan: body.visitPlan as VisitPlan,
      placeName: String(body.placeName ?? "Place"),
      facilities: body.facilities ?? [],
      fallbackRoute: body.fallbackRoute ?? [],
      contacts: body.contacts ?? [],
      unknowns: body.unknowns ?? [],
      evidenceDates: body.evidenceDates ?? [],
      plainLanguage: Boolean(body.plainLanguage),
      entranceImageAlt: body.entranceImageAlt,
    });
    return Response.json({ ok: true, pack });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
