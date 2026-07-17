import type { WorkerCredentialVerificationStatus } from "@prisma/client";

/** self_declared is never treated as externally verified. */
export function credentialIsVerified(
  status: WorkerCredentialVerificationStatus
): boolean {
  return status === "externally_verified";
}

export function selfDeclaredEqualsVerified(
  status: WorkerCredentialVerificationStatus
): false {
  void status;
  return false;
}
