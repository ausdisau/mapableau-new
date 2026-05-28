import { describe, expect, it } from "vitest";
import request from "supertest";

import { createChatgptMcpApp } from "../apps/chatgpt-mcp/src/server";

describe("chatgpt mcp http", () => {
  it("GET /health returns ok", async () => {
    const app = createChatgptMcpApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("mapable-chatgpt-mcp");
  });

  it("rejects /mcp without bearer when token configured", async () => {
    const prev = process.env.CHATGPT_MCP_BEARER_TOKEN;
    process.env.CHATGPT_MCP_BEARER_TOKEN = "test-secret-token";
    try {
      const app = createChatgptMcpApp();
      const res = await request(app)
        .post("/mcp")
        .set("Content-Type", "application/json")
        .send({});
      expect(res.status).toBe(401);
    } finally {
      if (prev === undefined) {
        delete process.env.CHATGPT_MCP_BEARER_TOKEN;
      } else {
        process.env.CHATGPT_MCP_BEARER_TOKEN = prev;
      }
    }
  });

  it("allows /mcp with valid bearer when token configured", async () => {
    const prev = process.env.CHATGPT_MCP_BEARER_TOKEN;
    process.env.CHATGPT_MCP_BEARER_TOKEN = "test-secret-token";
    try {
      const app = createChatgptMcpApp();
      const res = await request(app)
        .post("/mcp")
        .set("Authorization", "Bearer test-secret-token")
        .set("Content-Type", "application/json")
        .set("Accept", "application/json, text/event-stream")
        .send({
          jsonrpc: "2.0",
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0" },
          },
          id: 1,
        });
      expect([200, 202, 400, 406]).toContain(res.status);
    } finally {
      if (prev === undefined) {
        delete process.env.CHATGPT_MCP_BEARER_TOKEN;
      } else {
        process.env.CHATGPT_MCP_BEARER_TOKEN = prev;
      }
    }
  });
});
