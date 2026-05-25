import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { verifySocketToken } from "./auth/socket-auth.js";
import { registerMessageEvents, emitMessageNew } from "./events/message-events.js";
import { registerTypingEvents } from "./events/typing-events.js";
import { registerPresenceEvents } from "./events/presence-events.js";
import { threadRoom, userRoom, canJoinThreadRoom } from "./rooms/thread-rooms.js";
import { logRealtimeEvent } from "./audit/realtime-audit.js";

const port = Number(process.env.PORT ?? 4010);
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN ?? "*", credentials: true },
  connectionStateRecovery: {},
});

app.use(cors());
app.use(express.json());

app.post("/internal/publish", (req, res) => {
  const internalKey = process.env.REALTIME_INTERNAL_KEY;
  if (internalKey && req.headers["x-realtime-key"] !== internalKey) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { threadId, event, payload } = req.body as {
    threadId: string;
    event: string;
    payload: unknown;
  };
  if (!threadId || !event) {
    res.status(400).json({ error: "threadId and event required" });
    return;
  }
  if (event === "message:new") {
    emitMessageNew(io, threadId, payload);
  } else {
    io.to(threadRoom(threadId)).emit(event, payload);
  }
  res.json({ ok: true });
});

io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ??
    socket.handshake.headers.authorization?.replace("Bearer ", "");
  const auth = verifySocketToken(typeof token === "string" ? token : undefined);
  if (!auth) {
    next(new Error("Unauthorized"));
    return;
  }
  socket.data.profileId = auth.profileId;
  socket.data.primaryRole = auth.primaryRole;
  socket.data.permissions = auth.permissions;
  socket.data.allowedThreadIds = new Set<string>();
  next();
});

io.on("connection", (socket) => {
  const profileId = socket.data.profileId as string;
  socket.join(userRoom(profileId));

  socket.on("thread:join", ({ threadId }: { threadId: string }, ack) => {
    const allowed = socket.data.allowedThreadIds as Set<string>;
    if (!canJoinThreadRoom(threadId, allowed) && allowed.size === 0) {
      logRealtimeEvent("thread:join_denied", { profileId, threadId });
      ack?.({ ok: false, error: "Not authorised for this thread" });
      return;
    }
    if (!canJoinThreadRoom(threadId, allowed)) {
      ack?.({ ok: false, error: "Not authorised for this thread" });
      return;
    }
    socket.join(threadRoom(threadId));
    ack?.({ ok: true });
  });

  socket.on("thread:leave", ({ threadId }: { threadId: string }) => {
    socket.leave(threadRoom(threadId));
  });

  socket.on("thread:authorize", ({ threadIds }: { threadIds: string[] }) => {
    socket.data.allowedThreadIds = new Set(threadIds);
  });
});

registerMessageEvents(io);
registerTypingEvents(io);
registerPresenceEvents(io);

httpServer.listen(port, () => {
  console.info(`MapAble realtime gateway listening on :${port}`);
});
