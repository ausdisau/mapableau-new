export type MessagingDeliveryMode = "mock" | "live";

export interface MessagingDeliveryRequest {
  participantId: string;
  expression: string;
  conversationId?: string;
  idempotencyKey: string;
}

export interface MessagingDeliveryResult {
  mode: MessagingDeliveryMode;
  deliveryId: string;
  conversationId: string | null;
  /** Human-readable status; mock mode must state it is not a real send. */
  label: string;
  simulated: boolean;
}

export interface MessagingAdapter {
  deliver(request: MessagingDeliveryRequest): Promise<MessagingDeliveryResult>;
}

export class MockMessagingAdapter implements MessagingAdapter {
  async deliver(
    request: MessagingDeliveryRequest,
  ): Promise<MessagingDeliveryResult> {
    return {
      mode: "mock",
      deliveryId: `mock-${request.idempotencyKey}`,
      conversationId: request.conversationId ?? null,
      label:
        "Simulated delivery — not sent. Enable live messaging after review to deliver through MapAble.",
      simulated: true,
    };
  }
}
