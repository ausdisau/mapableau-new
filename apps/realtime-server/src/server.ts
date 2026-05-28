import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

import { Server } from "socket.io";

import { createMessageStreamService } from "./core/message-stream-service.js";
import { authorizeRoom } from "./rooms/room-policy.js";
import { registerSocketHandlers } from "./transport/socket-handlers.js";

export type RealtimeServer = {
  httpServer: ReturnType<typeof createServer>;
  io: Server;
  stream: ReturnType<typeof createMessageStreamService>;
};

export function createRealtimeServer(): RealtimeServer {
  const corsOrigin = process.env.SOCKETIO_CORS_ORIGIN ?? "*";

  const httpServer = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "mapable-realtime-server" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const io = new Server(httpServer, {
    cors: { origin: corsOrigin },
  });

  const stream = createMessageStreamService(authorizeRoom);
  registerSocketHandlers(io, stream);

  return { httpServer, io, stream };
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  const port = Number(process.env.PORT ?? 4010);
  const { httpServer } = createRealtimeServer();
  httpServer.listen(port, () => {
    console.log(`MapAble realtime server on :${port}`);
  });
}
