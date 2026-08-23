/**
 * Forbidden mobility-device actuation commands.
 * GAIS is observation-only — never device control.
 */
export const GAIS_FORBIDDEN_ACTUATION_COMMANDS = [
  "steer",
  "drive",
  "accelerate",
  "brake",
  "moveJoint",
  "changeDriveProfile",
  "move_joint",
  "change_drive_profile",
  "throttle",
  "actuate",
  "motorCommand",
  "motor_command",
] as const;

export type GaisForbiddenActuationCommand =
  (typeof GAIS_FORBIDDEN_ACTUATION_COMMANDS)[number];

function collectKeys(value: unknown, keys: Set<string>, depth = 0): void {
  if (depth > 8 || value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys, depth + 1);
    return;
  }
  if (typeof value !== "object") return;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    keys.add(k);
    if (typeof v === "string") keys.add(v);
    collectKeys(v, keys, depth + 1);
  }
}

/**
 * Returns forbidden actuation tokens found in a payload.
 * Used by schema validation and invariant tests.
 */
export function findForbiddenActuationCommands(payload: unknown): string[] {
  const keys = new Set<string>();
  collectKeys(payload, keys);
  const found: string[] = [];
  for (const forbidden of GAIS_FORBIDDEN_ACTUATION_COMMANDS) {
    for (const key of keys) {
      if (key === forbidden || key.toLowerCase() === forbidden.toLowerCase()) {
        found.push(forbidden);
        break;
      }
    }
  }
  return found;
}

export function assertNoActuationCommands(payload: unknown): {
  ok: boolean;
  forbidden: string[];
} {
  const forbidden = findForbiddenActuationCommands(payload);
  return { ok: forbidden.length === 0, forbidden };
}
