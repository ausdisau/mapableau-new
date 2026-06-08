import { prisma } from "@/lib/prisma";

export type OutboundPushResult = {
  pushed: boolean;
  status: "skipped" | "success" | "failed";
  message: string;
  httpStatus?: number;
};

function resolveWebhookUrl(configJson: unknown): string | null {
  if (!configJson || typeof configJson !== "object") return null;
  const record = configJson as Record<string, unknown>;
  const url = record.webhookUrl ?? record.exportWebhookUrl;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

/**
 * Push plan manager export payload to partner webhook when configured.
 */
export async function pushPlanManagerExport(params: {
  exportId: string;
  format: "json" | "csv";
  content: string | Record<string, unknown>[];
  partnerId: string;
}): Promise<OutboundPushResult> {
  const profile = await prisma.planManagerIntegrationProfile.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  const webhookUrl = resolveWebhookUrl(profile?.configJson);
  if (!webhookUrl) {
    return {
      pushed: false,
      status: "skipped",
      message: "No active PlanManagerIntegrationProfile webhook configured",
    };
  }

  const apiKey = process.env.PLAN_MANAGER_OUTBOUND_API_KEY;
  const body =
    typeof params.content === "string"
      ? params.content
      : JSON.stringify(params.content);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type":
          params.format === "csv" ? "text/csv" : "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        "X-MapAble-Export-Id": params.exportId,
        "X-MapAble-Partner-Id": params.partnerId,
      },
      body,
    });

    if (!res.ok) {
      return {
        pushed: false,
        status: "failed",
        message: `Partner webhook returned ${res.status}`,
        httpStatus: res.status,
      };
    }

    await prisma.planManagerPilotExport.update({
      where: { id: params.exportId },
      data: { status: "delivered" },
    });

    return {
      pushed: true,
      status: "success",
      message: "Export delivered to plan manager partner webhook",
      httpStatus: res.status,
    };
  } catch (e) {
    return {
      pushed: false,
      status: "failed",
      message: e instanceof Error ? e.message : "Webhook push failed",
    };
  }
}
