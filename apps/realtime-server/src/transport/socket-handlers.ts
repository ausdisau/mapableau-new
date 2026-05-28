import type { Server, Socket } from "socket.io";

import { authenticateSocketToken } from "../auth/socket-auth.js";
import type { MessageStreamService } from "../core/message-stream-service.js";
import { StreamError } from "../core/types.js";
import { isAllowedRoom } from "../rooms/room-policy.js";
import {
  parseAckPayload,
  parsePresencePayload,
  parsePublishPayload,
  parseRoom,
  parseTypingPayload,
} from "../validation/payloads.js";

export type SocketData = {
  userId: string;
};

function emitStreamError(socket: Socket, error: StreamError): void {
  socket.emit("stream:error", {
    code: error.code,
    message: error.message,
  });
}

function fanout(io: Server, room: string, event: string, payload: unknown): void {
  io.to(room).emit(event, payload);
}

function joinSocketRoom(socket: Socket, room: string): void {
  socket.join(room);
  socket.emit("room:joined", { room });
}

function resolveSocketRoom(socket: Socket, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  for (const room of socket.rooms) {
    if (room !== socket.id && isAllowedRoom(room)) return room;
  }
  return "";
}

export function registerSocketHandlers(
  io: Server,
  stream: MessageStreamService,
): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Unauthorized"));
    }
    const auth = authenticateSocketToken(token);
    if (!auth.ok) {
      return next(new Error("Unauthorized"));
    }
    (socket.data as SocketData).userId = auth.userId;
    next();
  });

  io.on("connection", (socket) => {
    const userId = (socket.data as SocketData).userId;

    const handleJoin = (rawRoom: unknown) => {
      try {
        const room = parseRoom(rawRoom);
        if (!isAllowedRoom(room)) {
          throw new StreamError("INVALID_ROOM", `Room not allowed: ${room}`);
        }
        stream.joinRoom(userId, room);
        joinSocketRoom(socket, room);
      } catch (e) {
        emitStreamError(socket, e instanceof StreamError ? e : new StreamError("INVALID_PAYLOAD", "Join failed"));
      }
    };

    const handleLeave = (rawRoom: unknown) => {
      try {
        const room = parseRoom(rawRoom);
        stream.leaveRoom(userId, room);
        socket.leave(room);
        socket.emit("room:left", { room });
      } catch (e) {
        emitStreamError(socket, e instanceof StreamError ? e : new StreamError("INVALID_PAYLOAD", "Leave failed"));
      }
    };

    const handlePublish = (raw: unknown) => {
      try {
        const parsed = parsePublishPayload(raw);
        const { message, fanout: event } = stream.publishMessage({
          ...parsed,
          senderId: userId,
        });
        fanout(io, message.room, event.type, event.payload);
      } catch (e) {
        emitStreamError(socket, e instanceof StreamError ? e : new StreamError("INVALID_PAYLOAD", "Publish failed"));
      }
    };

    const handleAck = (raw: unknown) => {
      try {
        const parsed = parseAckPayload(raw);
        const { result, fanout: event } = stream.ackMessage({
          messageId: parsed.messageId,
          room: resolveSocketRoom(socket, parsed.room),
          userId,
        });
        socket.emit("message:acked", result);
        if (result.room) {
          fanout(io, result.room, event.type, event.payload);
        }
      } catch (e) {
        emitStreamError(socket, e instanceof StreamError ? e : new StreamError("INVALID_PAYLOAD", "Ack failed"));
      }
    };

    const handleTyping = (raw: unknown) => {
      try {
        const parsed = parseTypingPayload(raw);
        const event = stream.broadcastTyping({ ...parsed, userId });
        fanout(io, parsed.room, event.type, event.payload);
      } catch (e) {
        emitStreamError(socket, e instanceof StreamError ? e : new StreamError("INVALID_PAYLOAD", "Typing failed"));
      }
    };

    const handlePresence = (raw: unknown) => {
      try {
        const parsed = parsePresencePayload(raw);
        const event = stream.broadcastPresence({ ...parsed, userId });
        fanout(io, parsed.room, event.type, event.payload);
      } catch (e) {
        emitStreamError(socket, e instanceof StreamError ? e : new StreamError("INVALID_PAYLOAD", "Presence failed"));
      }
    };

    socket.on("room:join", handleJoin);
    socket.on("join", handleJoin);

    socket.on("room:leave", handleLeave);
    socket.on("leave", handleLeave);

    socket.on("message:publish", handlePublish);

    socket.on("message:ack", handleAck);

    socket.on("typing", handleTyping);
    socket.on("presence", handlePresence);
  });
}
