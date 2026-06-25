export type FundingCategory =
  | "core_supports"
  | "capacity_building"
  | "capital"
  | "transport"
  | "unknown";

export type RuleOutcome = "allowed" | "reviewRequired" | "blocked";

export type ReviewFlag = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
};

export type ServiceRequest = {
  serviceType: string;
  requiresWheelchairVehicle?: boolean;
  isPersonalCare?: boolean;
  involvesChild?: boolean;
  priceCents?: number;
  fundingCategory?: FundingCategory;
};

export type ParticipantConsent = {
  shareSensitiveAccessNeeds: boolean;
  shareWithEmployer?: boolean;
};

export type ProviderVerification = {
  claimsNdisRegistration: boolean;
  verifiedNdisRegistration: boolean;
};

export type RuleResult = {
  outcome: RuleOutcome;
  reasons: string[];
  flags: ReviewFlag[];
};

export type NdisRuleContext = {
  serviceRequest: ServiceRequest;
  participantConsent?: ParticipantConsent;
  providerVerification?: ProviderVerification;
  priceLimitCents?: number;
};

export type NdisRuleDefinition = {
  id: string;
  message: string;
  when: (context: NdisRuleContext) => boolean;
  outcome: RuleOutcome;
  flag: ReviewFlag;
};
