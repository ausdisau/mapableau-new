import type { PilotSignalType } from "@prisma/client";

export type ClassifiedSignal = {
  signalType: PilotSignalType;
  severity: "low" | "medium" | "high" | "critical";
};

export function classifyPilotSignal(input: {
  source: string;
  keywords?: string[];
}): ClassifiedSignal {
  const keywords = (input.keywords ?? []).map((k) => k.toLowerCase());
  if (keywords.some((k) => k.includes("abuse") || k.includes("harm"))) {
    return { signalType: "incident", severity: "critical" };
  }
  if (input.source === "limit_breach") {
    return { signalType: "limit_breach", severity: "high" };
  }
  if (input.source === "complaint") {
    return { signalType: "complaint", severity: "medium" };
  }
  if (input.source === "accessibility") {
    return { signalType: "accessibility", severity: "medium" };
  }
  return { signalType: "other", severity: "low" };
}
