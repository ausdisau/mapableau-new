import { addEvidenceItem } from "@/lib/evidence-packs/evidence-source-service";
import { isModuleEnabled } from "@/lib/feature-flags/server-feature-flag";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function addTimelineToEvidencePack(params: {
  packId: string;
  timelineEventId: string;
  label: string;
  viewer: CurrentUser;
}) {
  if (!(await isModuleEnabled("evidence_pack_builder_enabled"))) {
    return { skipped: true };
  }
  return addEvidenceItem({
    packId: params.packId,
    sourceType: "timeline",
    sourceId: params.timelineEventId,
    label: params.label,
    viewer: params.viewer,
  });
}
