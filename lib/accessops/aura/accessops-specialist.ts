import type { SpecialistManifestTemplate } from "@/lib/aura/agents/manifests";

const ACCESSOPS_PROHIBITED_ACTIONS = [
  "accessops.publish_restricted_geometry",
  "accessops.activate_external_feed_production",
  "accessops.auto_penalty",
  "accessops.auto_regulator_contact",
  "accessops.sensor_actuate",
  "accessops.share_participant_location",
  "accessops.issue_infringement",
];

export const ACCESSOPS_SPECIALIST_MANIFEST: SpecialistManifestTemplate = {
  slug: "accessops",
  displayName: "AURA AccessOps",
  classification: "access",
  description:
    "Explains civic accessibility status, plans accessible route options, and drafts AccessOps incident or maintenance reviews without actuating devices or publishing restricted data.",
  allowedActionSlugs: [
    "accessops.explain_asset_status",
    "accessops.plan_accessible_journey",
    "accessops.summarise_incident",
    "accessops.draft_work_order",
    "accessops.prepare_public_update",
  ],
  prohibitedActionSlugs: ACCESSOPS_PROHIBITED_ACTIONS,
  requiresApprovalAtOrAbove: "medium_reversible",
  disclaimers: [
    "AccessOps information can be stale or incomplete; routes are not guaranteed safe.",
    "Restricted geometry and participant data are never included in public civic outputs.",
    "Sensors are observation-only; AURA AccessOps cannot actuate field equipment.",
  ],
};
