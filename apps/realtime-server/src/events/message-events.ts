import type { Server } from "socket.io";

import { threadRoom } from "../rooms/thread-rooms.js";
import { logRealtimeEvent } from "../audit/realtime-audit.js";

export function registerMessageEvents(io: Server) {
  io.on("connection", (socket) => {
    socket.on("message:send", (payload, ack) => {
      logRealtimeEvent("message:send_ignored", {
        profileId: socket.data.profileId,
        note: "Persist via REST API; socket only relays message:new",
      });
      ack?.({ ok: false, error: "Use REST API to send messages" });
    });
  });
}

export function emitMessageNew(
  io: Server,
  threadId: string,
  message: unknown
) {
  io.to(threadRoom(threadId)).emit("message:new", message);
  logRealtimeEvent("message:new", { threadId });
}
