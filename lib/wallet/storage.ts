/**
 * Placeholder storage adapter. Wave 9 keeps wallet content out of the
 * primary database — this module documents the intended external stores
 * (device secure element / platform KMS / hardware key) and provides a
 * uniform read/write shape for the shell adapter used in tests.
 */

export type WalletStorageBackend =
  | "platform_kms"
  | "device_secure_element"
  | "hardware_key"
  | "external_wallet_reference";

export function isPlatformManaged(backend: WalletStorageBackend): boolean {
  return backend === "platform_kms";
}

export function requiresParticipantDevice(
  backend: WalletStorageBackend
): boolean {
  return (
    backend === "device_secure_element" ||
    backend === "hardware_key" ||
    backend === "external_wallet_reference"
  );
}

/**
 * Simulator-only read path. Real integrations must implement a driver per
 * backend and never mirror private key material into the Prisma database.
 */
export function readSimulatorKeyMetadata(ref: string): {
  algorithm: string;
  simulator: true;
} {
  return { algorithm: "simulator.eddsa", simulator: true };
}
