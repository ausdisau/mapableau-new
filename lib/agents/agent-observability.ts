import { prisma } from "@/lib/prisma";

import { redactForTelemetry } from "./guardrails/pii-redaction";

export async function recordSafetyEvent(params: {
  agentRunId: string;
  eventType: string;
  severity: string;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.agentSafetyEvent.create({
    data: {
      agentRunId: params.agentRunId,
      eventType: params.eventType,
      severity: params.severity,
      reason: params.reason,
      metadataJson: params.metadata
        ? (JSON.parse(
            JSON.stringify(redactForTelemetry(params.metadata))
          ) as object)
        : undefined,
    },
  });
}

export async function getAgentRunMetrics(agentId?: string) {
  const where = agentId ? { agentId } : {};
  const [total, blocked, failed] = await Promise.all([
    prisma.agentRun.count({ where }),
    prisma.agentRun.count({ where: { ...where, status: "blocked" } }),
    prisma.agentRun.count({ where: { ...where, status: "failed" } }),
  ]);
  return { total, blocked, failed };
}
