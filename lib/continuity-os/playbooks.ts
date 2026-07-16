import playbookRegistry from "@/data/continuity-os/playbooks.v1.json";
import type { FailureClass } from "@/lib/continuity-os/types";

export interface RecoveryPlaybook {
  key: string;
  version: string;
  title: string;
  applicableFailureClasses: FailureClass[];
  initialSafetyChecks: string[];
  informationRequired: string[];
  participantQuestions: string[];
  prohibitedAssumptions: string[];
  immediateOptions: string[];
  shortTermOptions: string[];
  longerTermOptions: string[];
  requiredHumanRoles: string[];
  partnerServices: string[];
  rightsAndComplaintsRoutes: string[];
  evidenceRequirements: string[];
  recoveryReceiptFields: string[];
  outcomeReview: string;
  owner: string;
  reviewDate: string;
  specialistHighRisk: boolean;
}

const playbooks = playbookRegistry.playbooks as RecoveryPlaybook[];

export function listPlaybooks(): RecoveryPlaybook[] {
  return playbooks;
}

export function getPlaybook(key: string): RecoveryPlaybook | null {
  return playbooks.find((p) => p.key === key) ?? null;
}

export function playbooksForFailureClass(
  failureClass: FailureClass
): RecoveryPlaybook[] {
  return playbooks.filter((p) =>
    p.applicableFailureClasses.includes(failureClass)
  );
}

/** Specialist playbooks never allow AURA to investigate or close. */
export function isSpecialistHighRiskPlaybook(key: string): boolean {
  return getPlaybook(key)?.specialistHighRisk === true;
}
