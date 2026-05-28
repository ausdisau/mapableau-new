export type StreamMessage = {
  messageId: string;
  room: string;
  senderId: string;
  body: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type PublishMessageInput = {
  room: string;
  senderId: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export type AckMessageInput = {
  messageId: string;
  room: string;
  userId: string;
};

export type TypingInput = {
  room: string;
  userId: string;
  isTyping: boolean;
};

export type PresenceInput = {
  room: string;
  userId: string;
  status: "online" | "offline" | "away";
};

export type StreamErrorCode =
  | "INVALID_ROOM"
  | "ROOM_FORBIDDEN"
  | "INVALID_PAYLOAD"
  | "MESSAGE_NOT_FOUND"
  | "ALREADY_ACKED";

export class StreamError extends Error {
  constructor(
    readonly code: StreamErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StreamError";
  }
}

export type FanoutEvent =
  | { type: "message:new"; payload: StreamMessage }
  | {
      type: "message:acked";
      payload: { messageId: string; room: string; userId: string; timestamp: string };
    }
  | {
      type: "typing";
      payload: { room: string; userId: string; isTyping: boolean; timestamp: string };
    }
  | {
      type: "presence";
      payload: {
        room: string;
        userId: string;
        status: PresenceInput["status"];
        timestamp: string;
      };
    };

export type JoinRoomResult = {
  room: string;
  userId: string;
};

export type AckMessageResult = {
  messageId: string;
  room: string;
  userId: string;
  timestamp: string;
  alreadyAcked: boolean;
};
