/**
 * Soft Context Fabric adapter for Mission Watch (Prompt 04 optional).
 * When Context Fabric is absent, watches operate from the mission plan alone.
 */

export type ContextFabricSnapshotHook = (
  missionId: string,
) => Record<string, unknown> | null;

let snapshotHook: ContextFabricSnapshotHook | null = null;

export function registerContextFabricSnapshotHook(
  hook: ContextFabricSnapshotHook | null,
): void {
  snapshotHook = hook;
}

export function loadContextHints(missionId: string): Record<string, unknown> {
  if (snapshotHook) {
    return snapshotHook(missionId) ?? { source: "context_fabric_empty", missionId };
  }
  return { source: "mission_plan_only", missionId };
}
