import { BLOCKED_EXPORT_FIELDS } from "@/lib/data-governance/export-policy";
import { prisma } from "@/lib/prisma";

const DEFAULT_BLOCKED = new Set<string>(BLOCKED_EXPORT_FIELDS);

export async function getActiveDeidentificationRules(): Promise<Map<string, string>> {
  const rules = await prisma.deidentificationRule.findMany({
    where: { active: true },
  });
  return new Map(rules.map((r) => [r.fieldKey, r.strategy]));
}

export function redactField(key: string, value: unknown, strategy?: string): unknown {
  if (DEFAULT_BLOCKED.has(key)) return "[REDACTED]";
  if (/narrative|clinical|message|address|ndis/i.test(key)) return "[REDACTED]";
  if (strategy === "remove") return undefined;
  if (strategy === "hash" && typeof value === "string") {
    return `[HASH:${value.length}]`;
  }
  if (strategy === "bucket" && typeof value === "number") {
    return value < 10 ? "1-9" : value < 100 ? "10-99" : "100+";
  }
  return value;
}

export function deidentifyRecord(
  record: Record<string, unknown>,
  rules?: Map<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const strategy = rules?.get(key);
    const redacted = redactField(key, value, strategy);
    if (redacted !== undefined) {
      result[key] = redacted;
    }
  }
  return result;
}

export async function deidentifyMetrics(
  metrics: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const rules = await getActiveDeidentificationRules();
  return deidentifyRecord(metrics, rules);
}

export function stripSensitiveReportFields(
  metrics: Record<string, unknown>
): Record<string, unknown> {
  const blocked = [
    "incidentNarrative",
    "clinicalNotes",
    "privateMessages",
    "exactHomeAddress",
    "pickupAddress",
    "dropoffAddress",
    "safeguardingDetails",
    "participantNotes",
    "providerNotes",
  ];
  const result = { ...metrics };
  for (const key of blocked) {
    if (key in result) delete result[key];
  }
  return result;
}
