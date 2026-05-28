import { randomUUID } from "node:crypto";

import { DeliveryState } from "./delivery-state.js";
import {
  StreamError,
  type AckMessageInput,
  type AckMessageResult,
  type FanoutEvent,
  type JoinRoomResult,
  type PresenceInput,
  type PublishMessageInput,
  type StreamMessage,
  type TypingInput,
} from "./types.js";

export type RoomAuthorizer = (
  userId: string,
  room: string,
  action: "join" | "publish",
) => boolean;

export class MessageStreamService {
  constructor(
    private readonly delivery = new DeliveryState(),
    private readonly authorizeRoom: RoomAuthorizer,
  ) {}

  joinRoom(userId: string, room: string): JoinRoomResult {
    this.assertRoomAccess(userId, room, "join");
    return { room, userId };
  }

  leaveRoom(userId: string, room: string): { room: string; userId: string } {
    if (!room.trim()) {
      throw new StreamError("INVALID_PAYLOAD", "Room is required");
    }
    return { room, userId };
  }

  publishMessage(input: PublishMessageInput): {
    message: StreamMessage;
    fanout: FanoutEvent;
  } {
    const body = input.body?.trim();
    if (!body) {
      throw new StreamError("INVALID_PAYLOAD", "Message body is required");
    }
    this.assertRoomAccess(input.senderId, input.room, "publish");

    const message: StreamMessage = {
      messageId: randomUUID(),
      room: input.room,
      senderId: input.senderId,
      body,
      timestamp: new Date().toISOString(),
      metadata: input.metadata,
    };

    this.delivery.register(message.messageId, message.room, message.senderId);

    return {
      message,
      fanout: { type: "message:new", payload: message },
    };
  }

  ackMessage(input: AckMessageInput): { result: AckMessageResult; fanout: FanoutEvent } {
    if (!input.messageId?.trim()) {
      throw new StreamError("INVALID_PAYLOAD", "messageId is required");
    }

    let record;
    try {
      const acked = this.delivery.ack(input.messageId, input.userId);
      record = acked.record;
      const timestamp = record.acks.get(input.userId) ?? new Date().toISOString();
      const result: AckMessageResult = {
        messageId: input.messageId,
        room: record.room,
        userId: input.userId,
        timestamp,
        alreadyAcked: acked.alreadyAcked,
      };
      return {
        result,
        fanout: {
          type: "message:acked",
          payload: {
            messageId: result.messageId,
            room: result.room,
            userId: result.userId,
            timestamp: result.timestamp,
          },
        },
      };
    } catch {
      throw new StreamError("MESSAGE_NOT_FOUND", "Unknown message id");
    }
  }

  broadcastTyping(input: TypingInput): FanoutEvent {
    this.assertRoomAccess(input.userId, input.room, "publish");
    return {
      type: "typing",
      payload: {
        room: input.room,
        userId: input.userId,
        isTyping: input.isTyping,
        timestamp: new Date().toISOString(),
      },
    };
  }

  broadcastPresence(input: PresenceInput): FanoutEvent {
    this.assertRoomAccess(input.userId, input.room, "publish");
    return {
      type: "presence",
      payload: {
        room: input.room,
        userId: input.userId,
        status: input.status,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private assertRoomAccess(
    userId: string,
    room: string,
    action: "join" | "publish",
  ): void {
    if (!room?.trim()) {
      throw new StreamError("INVALID_PAYLOAD", "Room is required");
    }
    if (!this.authorizeRoom(userId, room, action)) {
      throw new StreamError(
        "ROOM_FORBIDDEN",
        `Not allowed to ${action} room ${room}`,
      );
    }
  }
}

export function createMessageStreamService(
  authorizeRoom: RoomAuthorizer,
): MessageStreamService {
  return new MessageStreamService(new DeliveryState(), authorizeRoom);
}
