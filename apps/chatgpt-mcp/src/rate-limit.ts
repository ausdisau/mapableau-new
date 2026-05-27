import type { NextFunction, Request, Response } from "express";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

const hits = new Map<string, { count: number; resetAt: number }>();

export function simpleRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({ error: "Too many requests. Try again shortly." });
    return;
  }

  next();
}
