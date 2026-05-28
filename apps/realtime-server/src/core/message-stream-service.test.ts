import { describe, expect, it } from "vitest";

import { DeliveryState } from "./delivery-state.js";
import { MessageStreamService } from "./message-stream-service.js";
import type { RoomAuthorizer } from "./message-stream-service.js";
import { StreamError } from "./types.js";

const allowAll: RoomAuthorizer = () => true;
const denyAll: RoomAuthorizer = () => false;

function createService(authorize: RoomAuthorizer) {
  return new MessageStreamService(new DeliveryState(), authorize);
}

describe("MessageStreamService", () => {
  it("publishes message and registers delivery", () => {
    const service = createService(allowAll);
    const { message, fanout } = service.publishMessage({
      room: "thread:abc",
      senderId: "user-1",
      body: "Hello",
    });
    expect(message.messageId).toBeTruthy();
    expect(fanout.type).toBe("message:new");
    expect(fanout.payload.body).toBe("Hello");
  });

  it("acks message once per user", () => {
    const service = createService(allowAll);
    const { message } = service.publishMessage({
      room: "thread:abc",
      senderId: "user-1",
      body: "Hi",
    });
    const first = service.ackMessage({
      messageId: message.messageId,
      room: message.room,
      userId: "user-2",
    });
    expect(first.result.alreadyAcked).toBe(false);

    const second = service.ackMessage({
      messageId: message.messageId,
      room: message.room,
      userId: "user-2",
    });
    expect(second.result.alreadyAcked).toBe(true);
  });

  it("rejects publish when room forbidden", () => {
    const service = createService(denyAll);
    expect(() =>
      service.publishMessage({
        room: "thread:abc",
        senderId: "user-1",
        body: "nope",
      }),
    ).toThrow(StreamError);
  });

  it("broadcasts typing and presence", () => {
    const service = createService(allowAll);
    const typing = service.broadcastTyping({
      room: "thread:abc",
      userId: "user-1",
      isTyping: true,
    });
    expect(typing.type).toBe("typing");

    const presence = service.broadcastPresence({
      room: "thread:abc",
      userId: "user-1",
      status: "online",
    });
    expect(presence.type).toBe("presence");
  });
});
