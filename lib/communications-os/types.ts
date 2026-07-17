import type {
  CommunicationPassportState,
  CommunicationRequirement,
} from "@/lib/connected-capability/contracts";
import type { EvidenceClass } from "@/lib/connected-capability/evidence";

export interface CommunicationPassportProjection {
  id: string;
  participantId: string;
  state: CommunicationPassportState;
  /** Participant-authored instructions — not inferred from diagnosis. */
  participantAuthoredInstructions: string[];
  requirements: CommunicationRequirement[];
  /** Communication support does not imply reduced decision-making capacity. */
  capacityImplication: "none";
  consentImplication: "none";
  source: {
    accessibilityProfileId: string | null;
    projectedFrom: "AccessibilityProfile";
    competingProfile: false;
  };
  evidenceClass: EvidenceClass;
  sourceVersion: string;
  isSynthetic?: boolean;
  updatedAt: string;
}

export const COMMUNICATION_AUDIT_ACTIONS = {
  passportViewed: "communications.passport.viewed",
  passportProjected: "communications.passport.projected",
  renderRequested: "communications.render.requested",
  handoffCardGenerated: "communications.handoff_card.generated",
} as const;
