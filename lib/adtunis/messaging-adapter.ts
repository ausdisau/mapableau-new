
import { adtunisConfig } from "@/lib/config/adtunis";
import {
  sendMessage,
  userCanAccessConversation,
} from "@/lib/messages/message-service";
import {
  MockMessagingAdapter,
  type MessagingAdapter,
  type MessagingDeliveryRequest,
  type MessagingDeliveryResult,
} from "@mapable/adtunis-core";

class LiveMessagingAdapter implements MessagingAdapter {
  async deliver(
    request: MessagingDeliveryRequest,
  ): Promise<MessagingDeliveryResult> {
    if (!request.conversationId) {
      return new MockMessagingAdapter().deliver(request);
    }
    const allowed = await userCanAccessConversation(
      request.participantId,
      request.conversationId,
      false,
    );
    if (!allowed) {
      throw new Error("You do not have access to that conversation.");
    }
    const message = await sendMessage({
      conversationId: request.conversationId,
      senderUserId: request.participantId,
      body: request.expression,
    });
    return {
      mode: "live",
      deliveryId: message.id,
      conversationId: request.conversationId,
      label: "Message delivered through MapAble messaging.",
      simulated: false,
    };
  }
}

const idempotencyCache = new Map<string, MessagingDeliveryResult>();

export function getMessagingAdapter(): MessagingAdapter {
  if (adtunisConfig.messagingMode === "live") {
    return new LiveMessagingAdapter();
  }
  return new MockMessagingAdapter();
}

export async function deliverWithIdempotency(
  request: MessagingDeliveryRequest,
): Promise<MessagingDeliveryResult> {
  const cached = idempotencyCache.get(request.idempotencyKey);
  if (cached) return cached;
  const result = await getMessagingAdapter().deliver(request);
  idempotencyCache.set(request.idempotencyKey, result);
  return result;
}
