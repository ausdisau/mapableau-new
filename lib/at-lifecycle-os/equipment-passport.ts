import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type EquipmentContinuitySignal,
} from "@/lib/connected-capability";

export type EquipmentLifecycleState =
  | "need_identified"
  | "options_considered"
  | "professional_assessment"
  | "trial"
  | "participant_decision"
  | "funding_pathway"
  | "order"
  | "delivery"
  | "configuration"
  | "training"
  | "use"
  | "maintenance"
  | "repair"
  | "temporary_replacement"
  | "review"
  | "retirement";

export interface EquipmentPassport {
  id: string;
  participantId: string;
  category:
    | "mobility"
    | "communication_device"
    | "transfer"
    | "hoist"
    | "positioning"
    | "pressure_care"
    | "environmental_control"
    | "vehicle"
    | "respiratory_reference"
    | "smart_home";
  label: string;
  lifecycleState: EquipmentLifecycleState;
  maintenance: Array<{
    id: string;
    dueAt: string;
    summary: string;
    overdue: boolean;
  }>;
  repairRequests: Array<{
    id: string;
    status: "draft" | "shadow_submitted" | "open" | "closed";
    summary: string;
    clinicalSuitabilityClaim: null;
  }>;
  continuity: EquipmentContinuitySignal;
  /** MapAble does not prescribe. */
  prescriptionAuthority: "authorised_professionals_only";
  sourceVersion: string;
  isSynthetic?: boolean;
  mode: "shadow" | "active";
}

export function buildTaylorCommunicationDevicePassport(): EquipmentPassport {
  const id = "fixture-taylor-aac-device";
  return {
    id,
    participantId: "fixture-taylor-participant",
    category: "communication_device",
    label: "Taylor AAC communication device (synthetic)",
    lifecycleState: "use",
    maintenance: [
      {
        id: "maint-battery-check",
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        summary: "Battery health and charge verification",
        overdue: false,
      },
    ],
    repairRequests: [],
    continuity: {
      equipmentPassportId: id,
      participantId: "fixture-taylor-participant",
      batteryStatus: "charged",
      maintenanceDue: false,
      repairOpen: false,
      transportCompatible: "needs_review",
      clinicalSuitabilityClaim: null,
      sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
      isSynthetic: true,
    },
    prescriptionAuthority: "authorised_professionals_only",
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
    isSynthetic: true,
    mode: "shadow",
  };
}

export function createShadowRepairRequest(
  passport: EquipmentPassport,
  summary: string
): EquipmentPassport {
  return {
    ...passport,
    lifecycleState: "repair",
    repairRequests: [
      ...passport.repairRequests,
      {
        id: `repair-${Date.now()}`,
        status: "shadow_submitted",
        summary,
        clinicalSuitabilityClaim: null,
      },
    ],
    continuity: {
      ...passport.continuity,
      repairOpen: true,
    },
  };
}
