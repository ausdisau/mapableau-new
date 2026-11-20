import { createServer } from "http";
import { Server, type Socket } from "socket.io";

import {
  authSecret,
  resolveSocketIdentity,
  type SocketIdentity,
} from "./auth/socket-auth";
import {
  assertCanJoinRoomOrThrow,
  RoomAuthorizationError,
} from "./rooms/room-policy";

const port = Number(process.env.PORT ?? 4010);
const isProduction = process.env.NODE_ENV === "production";

function resolveCorsOrigin(): string | string[] {
  const raw = process.env.SOCKETIO_CORS_ORIGIN?.trim() || "";
  if (!raw) {
    if (isProduction) {
      throw new Error(
        "SOCKETIO_CORS_ORIGIN is required in production (wildcard CORS forbidden)",
      );
    }
    // Dev-only default for local Next.js.
    return "http://localhost:3000";
  }
  if (raw === "*") {
    if (isProduction) {
      throw new Error(
        "Wildcard SOCKETIO_CORS_ORIGIN (*) is forbidden in production",
      );
    }
    return "*";
  }
  return raw.includes(",")
    ? raw.split(",").map((s) => s.trim()).filter(Boolean)
    : raw;
}

if (!authSecret()) {
  console.error(
    isProduction
      ? "SOCKETIO_AUTH_SECRET is required in production (min 16 chars)"
      : "SOCKETIO_AUTH_SECRET (or NEXTAUTH_SECRET in non-production) missing — all connects will be rejected",
  );
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: resolveCorsOrigin() },
});

type SocketData = {
  identity?: SocketIdentity;
};

io.use((socket, next) => {
  if (!authSecret()) {
    return next(new Error("Unauthorized"));
  }
  const identity = resolveSocketIdentity(socket.handshake.auth);
  if (!identity) {
    return next(new Error("Unauthorized"));
  }
  (socket.data as SocketData).identity = identity;
  next();
});

io.on("connection", (socket: Socket) => {
  socket.on("join", (room: string) => {
    void (async () => {
      const identity = (socket.data as SocketData).identity;
      try {
        const parsed = await assertCanJoinRoomOrThrow(identity, room);
        await socket.join(parsed.raw);
        socket.emit("room:joined", { room: parsed.raw });
      } catch (err) {
        const message =
          err instanceof RoomAuthorizationError
            ? err.message
            : "Room join failed";
        socket.emit("room:error", { error: message, room });
        // Hard-fail unauthorized joins — prevent IDOR probing sessions.
        socket.disconnect(true);
      }
    })();
  });

  socket.on("message:ack", (payload: { messageId: string }) => {
    socket.emit("message:acked", payload);
  });

  // Phase 0: no transport domain publish. Status contracts live in
  // lib/transport/events/transport-control-event-schemas.ts only.
});

httpServer.listen(port, () => {
  console.log(`MapAble realtime server on :${port}`);
});
