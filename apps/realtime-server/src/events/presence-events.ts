import type { Server, Socket } from "socket.io";

import { threadRoom } from "../rooms/thread-rooms.js";

export function registerPresenceEvents(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on(
      "presence:update",
      ({
        threadId,
        state,
      }: {
        threadId: string;
        state: "online" | "away" | "offline";
      }) => {
        if (!socket.data.profileId) return;
        socket.to(threadRoom(threadId)).emit("presence:update", {
          profileId: socket.data.profileId,
          state,
        });
      }
    );
  });
}
