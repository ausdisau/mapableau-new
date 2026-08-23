/**
 * Forbidden mobility actuation — Labs never controls real devices.
 */
export const LABS_FORBIDDEN_ACTUATION_COMMANDS = [
  "steer",
  "drive",
  "accelerate",
  "brake",
  "moveJoint",
  "changeDriveProfile",
  "motorCommand",
  "actuate",
] as const;

export function labsContractsContainActuation(source: string): boolean {
  const lower = source.toLowerCase();
  return LABS_FORBIDDEN_ACTUATION_COMMANDS.some((cmd) =>
    lower.includes(cmd.toLowerCase()),
  );
}
