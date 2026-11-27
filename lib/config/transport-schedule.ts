/**
 * Phase 1 Transport Control schedule / map / socket flags.
 * All default OFF — never treat unset as enabled.
 */

export const transportScheduleConfig = {
  mapEnabled: process.env.TRANSPORT_SCHEDULE_MAP_ENABLED === "true",
  socketEnabled: process.env.TRANSPORT_SCHEDULE_SOCKET_ENABLED === "true",
  /** Display timezone for matrix columns (store remains UTC). */
  displayTimeZone: "Australia/Sydney",
  slotMinutes: 15,
};

export function isTransportScheduleMapEnabled(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.TRANSPORT_SCHEDULE_MAP_ENABLED === "true";
}

export function isTransportScheduleSocketEnabled(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.TRANSPORT_SCHEDULE_SOCKET_ENABLED === "true";
}
