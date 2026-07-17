import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  finishRecoveryExecution,
  startRecoveryExecution,
} from "@/lib/continuity/execution/execution-service";

export const dynamic = "force-dynamic";

const startSchema = z.object({
  action: z.literal("start").default("start"),
  planId: z.string(),
  attempt: z.number().int().min(1).optional(),
  inputHash: z.string().optional(),
  nonce: z.string().optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
});

const finishSchema = z.object({
  action: z.literal("finish"),
  executionId: z.string(),
  status: z.enum(["completed", "failed", "execution_unknown", "compensated", "cancelled"]),
  errorNarrative: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  if (raw && raw.action === "finish") {
    const parsed = finishSchema.safeParse(raw);
    if (!parsed.success) return jsonError("Invalid finish payload", 400);
    try {
      const exec = await finishRecoveryExecution({
        executionId: parsed.data.executionId,
        status: parsed.data.status,
        errorNarrative: parsed.data.errorNarrative ?? null,
      });
      return jsonOk({ execution: exec });
    } catch (err) {
      return jsonError((err as Error).message ?? "FINISH_ERROR", 400);
    }
  }
  const parsed = startSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid start payload", 400);
  try {
    const exec = await startRecoveryExecution({
      planId: parsed.data.planId,
      attempt: parsed.data.attempt,
      inputHash: parsed.data.inputHash,
      nonce: parsed.data.nonce,
      snapshot: parsed.data.snapshot,
      actorUserId: user.id,
    });
    return jsonOk({ execution: exec }, 201);
  } catch (err) {
    return jsonError((err as Error).message ?? "START_ERROR", 400);
  }
}
