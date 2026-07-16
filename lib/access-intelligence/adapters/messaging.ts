/**
 * Messaging adapters for approved venue verification delivery.
 * Webhook adapter is live only when ACCESS_INTELLIGENCE_MESSAGING_WEBHOOK_URL is set.
 * Never send before Trust Kernel approval.
 */

import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import { AccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { evaluateActionPolicy } from "@/lib/access-intelligence/rights/action-policy";

export type MessagingAdapter = {
  readonly id: string;
  readonly mock: boolean;
  sendApprovedVerification(input: {
    recipient: string;
    payload: Record<string, unknown>;
    approvalId: string;
  }): Promise<{ deliveryId: string; status: "queued" | "mock_only" }>;
};

export class MockMessagingAdapter implements MessagingAdapter {
  readonly id = "mock-messaging";
  readonly mock = true as const;
  async sendApprovedVerification(input: {
    recipient: string;
    payload: Record<string, unknown>;
    approvalId: string;
  }) {
    return {
      deliveryId: `mock-msg-${input.approvalId}`,
      status: "mock_only" as const,
    };
  }
}

export class WebhookMessagingAdapter implements MessagingAdapter {
  readonly id = "webhook-messaging";
  readonly mock = false as const;
  private readonly webhookUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(options: { webhookUrl: string; apiKey?: string; timeoutMs?: number }) {
    this.webhookUrl = options.webhookUrl;
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  async sendApprovedVerification(input: {
    recipient: string;
    payload: Record<string, unknown>;
    approvalId: string;
  }): Promise<{ deliveryId: string; status: "queued" | "mock_only" }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          type: "venue_verification_request",
          approvalId: input.approvalId,
          recipient: input.recipient,
          payload: input.payload,
          sentAt: new Date().toISOString(),
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new AccessIntelligenceError(
          "REPOSITORY_UNAVAILABLE",
          `Messaging webhook returned HTTP ${response.status}.`,
          "Retry after confirming ACCESS_INTELLIGENCE_MESSAGING_WEBHOOK_URL is reachable.",
        );
      }
      const body: unknown = await response.json().catch(() => ({}));
      const deliveryId =
        body &&
        typeof body === "object" &&
        typeof (body as { deliveryId?: unknown }).deliveryId === "string"
          ? (body as { deliveryId: string }).deliveryId
          : `webhook-${input.approvalId}`;
      return { deliveryId, status: "queued" };
    } finally {
      clearTimeout(timer);
    }
  }
}

export function getMessagingAdapter(): MessagingAdapter {
  const url = process.env.ACCESS_INTELLIGENCE_MESSAGING_WEBHOOK_URL?.trim();
  if (url) {
    return new WebhookMessagingAdapter({
      webhookUrl: url,
      apiKey: process.env.ACCESS_INTELLIGENCE_MESSAGING_API_KEY,
    });
  }
  return new MockMessagingAdapter();
}

/**
 * Trust Kernel–gated venue verification: policy → persist → messaging → audit.
 * Caller must pass approved=true only after explicit in-product approval.
 */
export async function deliverApprovedVenueVerification(input: {
  userId: string;
  placeId: string;
  placeName: string;
  questions: string[];
  recipient: string;
  purpose: string;
  approved: boolean;
  approvalId: string;
  fieldKeys?: string[];
  createRequest: (args: {
    userId: string;
    placeId: string;
    questions: string[];
    recipient: string;
    purpose: string;
  }) => Promise<{ id: string; status: string }>;
}): Promise<{
  requestId: string;
  delivery: { deliveryId: string; status: "queued" | "mock_only"; mock: boolean };
  policy: ReturnType<typeof evaluateActionPolicy>;
}> {
  const fieldKeys = input.fieldKeys ?? ["verification_questions"];
  const policy = evaluateActionPolicy({
    action: "requestVenueVerification",
    userId: input.userId,
    requestedFields: fieldKeys,
    shareableFields: fieldKeys,
    approved: input.approved,
  });

  if (!policy.allowed) {
    recordAuditEvent({
      actorUserId: input.userId,
      action: "request_venue_verification",
      purpose: input.purpose,
      recipient: input.recipient,
      outcome: "cancelled",
      fieldsShared: [],
      metadata: { reasons: policy.reasons, approvalId: input.approvalId },
    });
    throw new AccessIntelligenceError(
      "APPROVAL_REQUIRED",
      policy.reasons.join(" ") || "Approval required before messaging the venue.",
      "Approve the exact payload in the Trust Kernel dialog, then retry.",
    );
  }

  const request = await input.createRequest({
    userId: input.userId,
    placeId: input.placeId,
    questions: input.questions,
    recipient: input.recipient,
    purpose: input.purpose,
  });

  const adapter = getMessagingAdapter();
  const delivery = await adapter.sendApprovedVerification({
    recipient: input.recipient,
    approvalId: input.approvalId,
    payload: {
      placeId: input.placeId,
      placeName: input.placeName,
      questions: input.questions,
      purpose: input.purpose,
      requestId: request.id,
      fieldsShared: policy.fieldsPermitted,
    },
  });

  recordAuditEvent({
    actorUserId: input.userId,
    action: "request_venue_verification_delivered",
    purpose: input.purpose,
    recipient: input.recipient,
    outcome: "executed",
    fieldsShared: policy.fieldsPermitted,
    metadata: {
      requestId: request.id,
      approvalId: input.approvalId,
      deliveryId: delivery.deliveryId,
      messagingAdapter: adapter.id,
      messagingMock: adapter.mock,
    },
  });

  return {
    requestId: request.id,
    delivery: { ...delivery, mock: adapter.mock },
    policy,
  };
}
