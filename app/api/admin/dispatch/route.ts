import type { DispatchQueueType } from "@prisma/client";
import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  listOpenDispatchQueues,
  recordDispatchAction,
} from "@/lib/dispatch-console/dispatch-service";
import { runPlatformDispatchSync } from "@/lib/service-planning/run-platform-sync";

const recordActionSchema = z.object({
  action: z.literal("record"),
  queueId: z.string(),
  actionType: z.string(),
  notes: z.string().optional(),
});

const syncSchema = z.object({
  action: z.literal("sync"),
});

const postSchema = z.discriminatedUnion("action", [
  syncSchema,
  recordActionSchema,
]);

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const category = url.searchParams.get("category") as
    | "care"
    | "transport"
    | "incident"
    | "all"
    | null;
  const queueType = url.searchParams.get("queueType") as DispatchQueueType | null;

  const queues = await listOpenDispatchQueues({
    category: category ?? "all",
    queueType: queueType ?? undefined,
  });

  return jsonOk({ queues });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  if (parsed.data.action === "sync") {
    const queues = await runPlatformDispatchSync(user.id);
    return jsonOk({ queues });
  }

  const action = await recordDispatchAction(
    parsed.data.queueId,
    user.id,
    parsed.data.actionType,
    parsed.data.notes
  );
  return jsonOk({ action });
}
