/** Idle warning timing for multi-step tasks (ms). */
export const DEFAULT_TASK_IDLE_MS = 15 * 60 * 1000;
export const LONGER_TASK_IDLE_MS = 45 * 60 * 1000;

export function resolveTaskIdleMs(longerTaskTime: boolean): number {
  return longerTaskTime ? LONGER_TASK_IDLE_MS : DEFAULT_TASK_IDLE_MS;
}

/** Read document attribute set by accessibility preferences. */
export function documentLongerTaskTimeEnabled(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.a11yLongerTasks === "true";
}
