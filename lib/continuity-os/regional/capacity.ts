import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { isRegionalRecoveryEnabled } from "@/lib/continuity-os/feature-flags";

export interface RegionalRecoveryOption {
  id: string;
  kind:
    | "nearby_worker"
    | "accessible_vehicle"
    | "temporary_equipment"
    | "alternate_venue"
    | "community_transport"
    | "remote_support"
    | "regional_navigator"
    | "partner_provider"
    | "mobile_service_day"
    | "hub_escalation";
  label: string;
  status: "requires_confirmation" | "unknown" | "human_review_required";
  timeLimited: boolean;
  purposeBound: boolean;
  credentialCheckRequired: boolean;
  automaticAssignmentForbidden: true;
}

/**
 * Shadow/search stub for regional mutual aid. Never auto-assigns.
 */
export function searchRegionalRecoveryOptions(params: {
  regionCode?: string;
  needs: string[];
}): RegionalRecoveryOption[] {
  if (!isRegionalRecoveryEnabled()) {
    throw new ContinuityOsError(
      "REGIONAL_RECOVERY_DISABLED",
      "Regional recovery is disabled.",
      503
    );
  }

  void params.regionCode;
  const options: RegionalRecoveryOption[] = [];

  if (params.needs.includes("transport")) {
    options.push({
      id: "regional-community-transport",
      kind: "community_transport",
      label: "Community transport (requires confirmation)",
      status: "requires_confirmation",
      timeLimited: true,
      purposeBound: true,
      credentialCheckRequired: true,
      automaticAssignmentForbidden: true,
    });
  }
  if (params.needs.includes("care")) {
    options.push({
      id: "regional-navigator",
      kind: "regional_navigator",
      label: "Regional navigator assistance",
      status: "human_review_required",
      timeLimited: true,
      purposeBound: true,
      credentialCheckRequired: true,
      automaticAssignmentForbidden: true,
    });
  }
  if (params.needs.includes("equipment")) {
    options.push({
      id: "temporary-equipment",
      kind: "temporary_equipment",
      label: "Temporary equipment loan (unverified until supplier confirms)",
      status: "unknown",
      timeLimited: true,
      purposeBound: true,
      credentialCheckRequired: true,
      automaticAssignmentForbidden: true,
    });
  }

  options.push({
    id: "hub-escalation",
    kind: "hub_escalation",
    label: "Hub escalation",
    status: "human_review_required",
    timeLimited: true,
    purposeBound: true,
    credentialCheckRequired: true,
    automaticAssignmentForbidden: true,
  });

  return options;
}
