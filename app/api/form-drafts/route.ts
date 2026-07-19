import type { Prisma } from "@prisma/client";
import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessIndependenceConfig } from "@/lib/config/access-independence";
import {
  FORM_DRAFT_SCHEMA_VERSION,
  sanitizeAccountDraftPayload,
} from "@/lib/form-drafts/draft-storage";
import { prisma } from "@/lib/prisma";

const upsertSchema = z
  .object({
    workflowKey: z.string().min(1).max(120),
    stepId: z.string().max(120).nullable().optional(),
    payload: z.record(z.string(), z.unknown()),
    ttlDays: z.number().int().min(1).max(90).default(30),
  })
  .strict();

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const workflowKey = new URL(req.url).searchParams.get("workflowKey");
  if (!workflowKey) return jsonError("workflowKey is required", 400);

  const draft = await prisma.formDraft.findUnique({
    where: {
      userId_workflowKey: { userId: user.id, workflowKey },
    },
  });

  if (!draft || draft.expiresAt.getTime() <= Date.now()) {
    if (draft) {
      await prisma.formDraft.delete({ where: { id: draft.id } }).catch(() => undefined);
    }
    return jsonOk({ draft: null });
  }

  if (draft.schemaVersion !== FORM_DRAFT_SCHEMA_VERSION) {
    await prisma.formDraft.delete({ where: { id: draft.id } }).catch(() => undefined);
    return jsonOk({ draft: null });
  }

  return jsonOk({
    draft: {
      id: draft.id,
      workflowKey: draft.workflowKey,
      schemaVersion: draft.schemaVersion,
      stepId: draft.stepId,
      payload: draft.payload,
      expiresAt: draft.expiresAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    },
  });
}

export async function PUT(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = upsertSchema.parse(await req.json());
    const payload = sanitizeAccountDraftPayload(body.payload);
    const serialized = JSON.stringify(payload);
    if (serialized.length > accessIndependenceConfig.localDraftMaxBytes * 8) {
      return jsonError("Draft payload is too large", 413);
    }
    const expiresAt = new Date(Date.now() + body.ttlDays * 24 * 60 * 60 * 1000);

    const draft = await prisma.formDraft.upsert({
      where: {
        userId_workflowKey: {
          userId: user.id,
          workflowKey: body.workflowKey,
        },
      },
      create: {
        userId: user.id,
        workflowKey: body.workflowKey,
        schemaVersion: FORM_DRAFT_SCHEMA_VERSION,
        stepId: body.stepId ?? null,
        payload: payload as Prisma.InputJsonValue,
        expiresAt,
      },
      update: {
        schemaVersion: FORM_DRAFT_SCHEMA_VERSION,
        stepId: body.stepId ?? null,
        payload: payload as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return jsonOk({
      draft: {
        id: draft.id,
        workflowKey: draft.workflowKey,
        stepId: draft.stepId,
        updatedAt: draft.updatedAt.toISOString(),
        expiresAt: draft.expiresAt.toISOString(),
      },
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not save draft", 500);
  }
}

export async function DELETE(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const workflowKey = new URL(req.url).searchParams.get("workflowKey");
  if (!workflowKey) return jsonError("workflowKey is required", 400);

  await prisma.formDraft
    .delete({
      where: {
        userId_workflowKey: { userId: user.id, workflowKey },
      },
    })
    .catch(() => undefined);

  return jsonOk({ deleted: true });
}
