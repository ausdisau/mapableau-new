export type AbnEntityStatus = "Active" | "Cancelled" | "Unknown";

export type AbnLookupResult = {
  mode: "mock" | "http";
  abn: string;
  entityName: string | null;
  entityStatus: AbnEntityStatus;
  entityType: string | null;
  gstRegistered: boolean | null;
  message: string | null;
  exceptionCode: string | null;
  exceptionDescription: string | null;
  rawAvailable: boolean;
};

export type OrganisationNameMatch = {
  matchScore: number;
  matchReason: string;
  passed: boolean;
};

export type AbnCheckNotes = {
  checkedAt: string;
  mode: "mock" | "http";
  abn: string;
  entityName: string | null;
  entityStatus: AbnEntityStatus;
  entityType: string | null;
  gstRegistered: boolean | null;
  nameMatch: OrganisationNameMatch;
  message: string | null;
};
