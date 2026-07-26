import { createServer } from "http";
import { Server } from "socket.io";

import { verifySocketToken } from "./auth/socket-auth.js";
import { canJoinRoom } from "./rooms/room-policy.js";

const port = Number(process.env.PORT ?? 4010);
const httpServer = createServer();
const io = new Server(httpServer, {
  // Prefer an explicit CORS allowlist in production; default remains restrictive.
  cors: {
    origin: process.env.SOCKETIO_CORS_ORIGIN?.split(",").map((s) => s.trim()) ??
      false,
  },
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token || typeof token !== "string") {
    return next(new Error("Unauthorized"));
  }

  const claims = verifySocketToken(token);
  if (!claims) {
    return next(new Error("Unauthorized"));
  }

  (socket.data as { userId?: string; userRole?: string }).userId =
    claims.userId;
  (socket.data as { userId?: string; userRole?: string }).userRole =
    claims.userRole;
  next();
});

io.on("connection", (socket) => {
  socket.on("join", async (room: string, ack?: (result: unknown) => void) => {
    const userId = (socket.data as { userId?: string }).userId ?? "";
    const userRole = (socket.data as { userRole?: string }).userRole ?? "";

    // SECURITY: authorize BEFORE socket.join — never trust client room IDs.
    const decision = await canJoinRoom(userId, userRole, room);
    if (!decision.allowed) {
      ack?.({ ok: false, error: "forbidden", reason: decision.reason });
      socket.emit("room:denied", { room, reason: decision.reason });
      return;
    }

    await socket.join(room);
    ack?.({ ok: true, room });
    socket.emit("room:joined", { room });
  });

  socket.on("message:ack", (payload: { messageId: string }) => {
    socket.emit("message:acked", payload);
  });
});

httpServer.listen(port, () => {
  console.log(`MapAble realtime server on :${port}`);
});
