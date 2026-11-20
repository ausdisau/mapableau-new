/** Read-only, default-disabled Care Scheduler UI. No booking/roster writers. */
export function isCareSchedulerUiEnabled(): boolean {
  return process.env.MAPABLE_CARE_SCHEDULER_UI_ENABLED === "true";
}
