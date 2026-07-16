import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  bindGuideFacts,
  FactBinderError,
  renderGuideHtml,
  type GuideSectionDraft,
} from "@/lib/access-intelligence/guides";

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.guideGenerator) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json().catch(() => ({}));

  try {
    const bound = bindGuideFacts((body.sections ?? []) as GuideSectionDraft[]);
    const html = renderGuideHtml({
      title: String(body.title ?? "Access guide"),
      sections: bound.sections,
      plainLanguage: Boolean(body.plainLanguage),
    });
    return Response.json({
      ok: true,
      evidenceReferences: bound.evidenceReferences,
      html,
      actorUserId: userId,
    });
  } catch (err) {
    const message = err instanceof FactBinderError ? err.message : "Guide bind failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
