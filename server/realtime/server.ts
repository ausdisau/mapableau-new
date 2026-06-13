import { createServer } from "http";
import { Server } from "socket.io";

import { verifySocketToken } from "@/server/realtime/auth/socket-auth";
import { isAllowedRoom } from "@/server/realtime/rooms/room-policy";

const port = Number(process.env.PORT ?? 4010);
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.SOCKETIO_CORS_ORIGIN ?? "*" },
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token || typeof token !== "string" || !verifySocketToken(token)) {
    return next(new Error("Unauthorized"));
  }
  (socket.data as { userId?: string }).userId = "verified";
  next();
});

io.on("connection", (socket) => {
  socket.on("join", (room: string) => {
    if (typeof room === "string" && isAllowedRoom(room)) {
      socket.join(room);
    }
  });

  socket.on("message:ack", (payload: { messageId: string }) => {
    socket.emit("message:acked", payload);
  });
});

httpServer.listen(port, () => {
  console.log(`MapAble realtime server on :${port}`);
});
