#!/usr/bin/env npx tsx
/**
 * MapAble ChatGPT App — Streamable HTTP MCP server for OpenAI Apps SDK connectors.
 */
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import cors from "cors";

import { bearerAuthMiddleware } from "@/apps/chatgpt-mcp/src/auth";
import { simpleRateLimit } from "@/apps/chatgpt-mcp/src/rate-limit";
import {
  getChatgptMcpAllowedHosts,
  getChatgptMcpBindHost,
  getChatgptMcpPort,
} from "@/lib/mcp/config";
import { createMapableMcpServer } from "@/lib/mcp/register-mapable-tools";

const transports: Record<string, StreamableHTTPServerTransport> = {};

export function createChatgptMcpApp() {
  const bindHost = getChatgptMcpBindHost();
  const allowedHosts = getChatgptMcpAllowedHosts();

  const app = createMcpExpressApp({
    host: bindHost,
    allowedHosts,
  });

  app.use(
    cors({
      origin: true,
      exposedHeaders: ["Mcp-Session-Id"],
    }),
  );
  app.use(simpleRateLimit);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "mapable-chatgpt-mcp" });
  });

  async function handleMcpRequest(
    req: import("express").Request,
    res: import("express").Response,
  ) {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports[id] = transport;
          },
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };

        const server = createMapableMcpServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  }

  app.post("/mcp", bearerAuthMiddleware, handleMcpRequest);
  app.get("/mcp", bearerAuthMiddleware, (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    void transports[sessionId].handleRequest(req, res);
  });
  app.delete("/mcp", bearerAuthMiddleware, (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    void transports[sessionId].handleRequest(req, res);
  });

  return app;
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

async function closeAllTransports() {
  await Promise.all(Object.values(transports).map((t) => t.close()));
}

if (isMainModule()) {
  const port = getChatgptMcpPort();
  const bindHost = getChatgptMcpBindHost();
  const app = createChatgptMcpApp();

  app.listen(port, bindHost, () => {
    console.log(
      `MapAble ChatGPT MCP listening on http://${bindHost}:${port}/mcp (health: /health)`,
    );
  });

  process.on("SIGINT", async () => {
    await closeAllTransports();
    process.exit(0);
  });
}
