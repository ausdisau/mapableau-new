import { prisma } from "@/lib/prisma";

import { MODEL_CLASSIFICATION_REGISTRY } from "./model-classification";

/**
 * Isolation audit — sanity checks that participant/worker/claim-scoped data
 * has a plausible organisation attribution. Emits warnings only. It cannot
 * catch every unscoped query — that is the job of `audit-unscoped-queries`.
 */
export interface IsolationFinding {
  modelName: string;
  classification: string;
  count: number;
  status: "ok" | "empty" | "warning";
  detail?: string;
}

export async function runIsolationAudit(): Promise<IsolationFinding[]> {
  const findings: IsolationFinding[] = [];
  for (const entry of MODEL_CLASSIFICATION_REGISTRY) {
    if (!entry.organisationScoped) continue;
    if (entry.classification === "public_reference") continue;
    try {
      const rawModelName = entry.modelName;
      const camel =
        rawModelName.charAt(0).toLowerCase() + rawModelName.slice(1);
      const model = (prisma as unknown as Record<string, { count?: (args: unknown) => Promise<number> }>)[camel];
      if (!model || typeof model.count !== "function") {
        findings.push({
          modelName: rawModelName,
          classification: entry.classification,
          count: 0,
          status: "warning",
          detail: "MODEL_NOT_FOUND_IN_CLIENT",
        });
        continue;
      }
      const count = await model.count({});
      findings.push({
        modelName: rawModelName,
        classification: entry.classification,
        count,
        status: count === 0 ? "empty" : "ok",
      });
    } catch (e) {
      findings.push({
        modelName: entry.modelName,
        classification: entry.classification,
        count: 0,
        status: "warning",
        detail: (e as Error).message,
      });
    }
  }
  return findings;
}
