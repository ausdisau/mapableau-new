/** Client-safe identity verification constants/types (no server-only imports). */

import type { WorkerCredentialStatus } from "@prisma/client";

export type IdentityVerificationProvider = "manual_review" | "stripe_identity";

export type IdentityVerificationStatusView = {
  workerProfileId: string;
  verificationStatus: WorkerCredentialStatus;
  workerScreeningStatus: WorkerCredentialStatus;
  provider: IdentityVerificationProvider;
  stripeIdentityConfigured: boolean;
  canStart: boolean;
};

export const IDENTITY_VERIFICATION_STEPS = [
  "Worker initiates ID verification",
  "Redirect to third-party service (e.g., Stripe Identity, IDVerse)",
  "Upload ID and selfie for liveness check",
  "Third-party validates ID and returns result",
  "Verification result stored in backend",
  "Worker profile updated (badge shown)",
  "Optional: Cross-check with NDIS Worker Screening DB",
  "Audit log saved with timestamp",
] as const;
