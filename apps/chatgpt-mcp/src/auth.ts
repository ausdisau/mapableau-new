import type { NextFunction, Request, Response } from "express";

import { requireChatgptMcpBearerToken } from "@/lib/mcp/config";

export function bearerAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let required: string | null;
  try {
    required = requireChatgptMcpBearerToken();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Auth misconfigured";
    res.status(500).json({ error: message });
    return;
  }

  if (!required) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (header === `Bearer ${required}`) {
    next();
    return;
  }

  res.status(401).json({
    error: "Unauthorized. Provide Authorization: Bearer <CHATGPT_MCP_BEARER_TOKEN>.",
  });
}
