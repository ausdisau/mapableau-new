import type { DataClass } from "@/lib/ai/platform/types/classification";

export type ProcessorType =
  | "device_runtime"
  | "mapable_private"
  | "approved_external"
  | "deterministic_only";

export type ProcessingProviderRecord = {
  providerId: string;
  displayName: string;
  processorType: ProcessorType;
  approved: boolean;
  deploymentZones: Array<
    "DEVICE_EDGE" | "MAPABLE_PRIVATE" | "APPROVED_EXTERNAL"
  >;
  permittedSensitivity: Array<
    | "D0_PUBLIC"
    | "D1_INTERNAL"
    | "D2_PERSONAL"
    | "D3_SENSITIVE"
    | "D4_RESTRICTED"
  >;
  permittedDataClasses: DataClass[];
  prohibitedDataClasses: DataClass[];
  permittedPurposes: string[];
  jurisdictions: string[];
  dataResidency: string[];
  subprocessors: string[];
  remoteAdminJurisdictions: string[];
  retentionPolicy: string;
  modelTrainingUse: "none" | "opt_in_only" | "prohibited";
  loggingPolicy: string;
  breachNotificationCommitment: string;
  contractReference: string | null;
  privacyReviewStatus: "not_started" | "in_progress" | "approved" | "rejected";
  securityReviewStatus: "not_started" | "in_progress" | "approved" | "rejected";
  reviewDueDate: string | null;
  killSwitchKey: string;
  algorithmRegisterRef: string | null;
};
