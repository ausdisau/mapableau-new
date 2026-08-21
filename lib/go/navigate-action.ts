/**
 * UI-only navigation actions for assistive input bridge.
 * No movement / propulsion vocabulary permitted.
 */
export const NAVIGATE_ACTIONS = [
  "NEXT",
  "PREVIOUS",
  "LEFT",
  "RIGHT",
  "SELECT",
  "BACK",
  "OPEN_MENU",
  "REPEAT_INSTRUCTION",
  "WHERE_AM_I",
  "REROUTE",
  "REPORT_BARRIER",
  "REQUEST_ASSISTANCE",
] as const;

export type NavigateAction = (typeof NAVIGATE_ACTIONS)[number];

/** Prohibited action tokens — must never appear in Go MCP or action enums. */
export const PROHIBITED_WHEELCHAIR_ACTIONS = [
  "driveForward",
  "driveBackward",
  "turnLeft",
  "turnRight",
  "setDriveAxis",
  "setSpeed",
  "setAcceleration",
  "releaseBrake",
  "changeDriveProfile",
  "enableExternalDriveControl",
  "moveSeat",
  "tiltSeat",
  "reclineSeat",
  "elevateSeat",
  "stand",
  "modifyFirmware",
] as const;

export function isNavigateAction(value: string): value is NavigateAction {
  return (NAVIGATE_ACTIONS as readonly string[]).includes(value);
}
