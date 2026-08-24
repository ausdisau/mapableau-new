import { captureAiPlatformTelemetry } from "@/lib/ai/platform/telemetry/adapter";

import type { MissionTelemetryKind } from "./types";

export function captureMissionTelemetry(input: {
  kind: MissionTelemetryKind;
  missionId: string;
  traceId: string;
  capabilityKey?: string;
  reason?: string;
}): void {
  captureAiPlatformTelemetry({
    kind: input.kind,
    capabilityKey: input.capabilityKey ?? "mission.runtime",
    reason: input.reason,
    tenantScoped: true,
  });
}
