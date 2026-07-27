/** Client-safe worker screening constants/types (no server-only imports). */

export const AU_JURISDICTIONS = [
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "ACT",
  "NT",
] as const;

export type AuJurisdiction = (typeof AU_JURISDICTIONS)[number];

export type ScreeningSubmissionView = {
  id: string;
  workerProfileId: string;
  workerName: string;
  jurisdiction: string;
  submittedAt: string;
  status: "Pending" | "Verified" | "Rejected" | "Expired" | "Not provided";
  documentId: string | null;
};
