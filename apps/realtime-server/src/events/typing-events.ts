import type { Server, Socket } from "socket.io";

import { threadRoom } from "../rooms/thread-rooms.js";

export function registerTypingEvents(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("typing:start", ({ threadId }: { threadId: string }) => {
      if (!socket.data.profileId) return;
      socket.to(threadRoom(threadId)).emit("typing:start", {
        profileId: socket.data.profileId,
      });
    });
    socket.on("typing:stop", ({ threadId }: { threadId: string }) => {
      if (!socket.data.profileId) return;
      socket.to(threadRoom(threadId)).emit("typing:stop", {
        profileId: socket.data.profileId,
      });
    });
  });
}
