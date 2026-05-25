import type { TransportAccessNeed } from "@prisma/client";

export function buildAccessNeedsSummary(
  needs: TransportAccessNeed | null | undefined,
  options?: { canViewDetail: boolean }
) {
  if (!needs) {
    return { lines: ["No specific access needs recorded."], shared: true };
  }

  if (needs.shareAccessibility && !options?.canViewDetail) {
    return {
      lines: [
        "Access needs are on file. Share consent is required for providers to view details.",
      ],
      shared: false,
    };
  }

  const lines: string[] = [];
  if (needs.wheelchairRequired) lines.push("Wheelchair-accessible vehicle required.");
  if (needs.assistedPickup) lines.push("Assisted pickup at departure.");
  if (needs.assistedDropoff) lines.push("Assisted drop-off at destination.");
  if (needs.driverAssistanceRequired) {
    lines.push("Driver assistance required during the trip.");
  }
  if (needs.assistanceNotes) lines.push(needs.assistanceNotes);

  if (lines.length === 0) {
    lines.push("Standard transport - no additional access needs noted.");
  }

  return { lines, shared: options?.canViewDetail ?? true };
}
