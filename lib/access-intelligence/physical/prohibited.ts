/**
 * Immutable registry of action types that can never be allowlisted.
 * These remain blocked regardless of mode, approval, or venue policy.
 */

export const IMMUTABLE_PROHIBITED_ACTIONS = Object.freeze([
  "transfer_person",
  "control_mobility_device",
  "override_fire_door",
  "disable_emergency_systems",
  "force_open_elevator_doors",
  "control_medical_device",
  "override_life_safety",
  "remote_drive_vehicle",
  "unlock_all_doors",
  "suppress_alarms",
  "move_person_without_consent",
  "control_restraint",
  "override_egress_lock",
  "disable_sprinkler",
  "force_close_fire_shutter",
  "bypass_access_control_globally",
] as const);

export type ImmutableProhibitedAction =
  (typeof IMMUTABLE_PROHIBITED_ACTIONS)[number];

const PROHIBITED_SET: ReadonlySet<string> = new Set(IMMUTABLE_PROHIBITED_ACTIONS);

export function isProhibitedAction(actionType: string): boolean {
  return PROHIBITED_SET.has(actionType);
}
