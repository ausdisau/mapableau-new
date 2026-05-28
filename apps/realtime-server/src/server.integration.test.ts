import { describe, expect, it, afterEach } from "vitest";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";

import { createSocketAuthToken } from "./auth/socket-auth.js";
import { createRealtimeServer } from "./server.js";

describe("realtime server integration", () => {
  let client: ClientSocket | undefined;

  afterEach(() => {
    client?.disconnect();
    client = undefined;
  });

  it("rejects connection without token", async () => {
    process.env.SOCKET_ALLOW_DEV_TOKEN = "true";
    const { httpServer } = createRealtimeServer();
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const port = (httpServer.address() as { port: number }).port;

    await expect(
      new Promise<void>((resolve, reject) => {
        const bad = ioc(`http://127.0.0.1:${port}`, {
          transports: ["websocket"],
          autoConnect: true,
        });
        bad.on("connect", () => reject(new Error("should not connect")));
        bad.on("connect_error", () => {
          bad.disconnect();
          resolve();
        });
      }),
    ).resolves.toBeUndefined();

    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it("joins room, publishes, and acks", async () => {
    process.env.SOCKET_ALLOW_DEV_TOKEN = "true";
    delete process.env.SOCKET_AUTH_SECRET;
    const { httpServer } = createRealtimeServer();
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const port = (httpServer.address() as { port: number }).port;

    client = ioc(`http://127.0.0.1:${port}`, {
      transports: ["websocket"],
      auth: { token: createSocketAuthToken("user-a") },
    });

    await new Promise<void>((resolve, reject) => {
      client!.on("connect", () => resolve());
      client!.on("connect_error", (err) => reject(err));
    });

    const joined = new Promise<void>((resolve, reject) => {
      client!.emit("room:join", "thread:test-1");
      client!.once("room:joined", (payload: { room: string }) => {
        if (payload.room === "thread:test-1") resolve();
        else reject(new Error("unexpected room"));
      });
      setTimeout(() => reject(new Error("join timeout")), 3000);
    });
    await joined;

    const messageReceived = new Promise<{ messageId: string }>((resolve, reject) => {
      client!.once("message:new", (msg: { messageId: string; body: string }) => {
        if (msg.body === "hello stream") resolve({ messageId: msg.messageId });
        else reject(new Error("unexpected body"));
      });
      client!.emit("message:publish", {
        room: "thread:test-1",
        body: "hello stream",
      });
      setTimeout(() => reject(new Error("message timeout")), 3000);
    });
    const { messageId } = await messageReceived;

    const acked = new Promise<void>((resolve, reject) => {
      client!.once("message:acked", (payload: { messageId: string }) => {
        if (payload.messageId === messageId) resolve();
        else reject(new Error("wrong ack id"));
      });
      client!.emit("message:ack", { messageId, room: "thread:test-1" });
      setTimeout(() => reject(new Error("ack timeout")), 3000);
    });
    await acked;

    client.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });
});
