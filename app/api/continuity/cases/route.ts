import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  listContinuityCases,
  openOrExtendContinuityCase,
  transitionContinuityCase,
} from "@/lib/continuity/cases/case-service";

export const dynamic = "force-dynamic";

const listSchema = z.object({
  organisationId: z.string().min(1),
  coordinatorId: z.string().optional(),
  participantId: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursorId: z.string().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return jsonError("organisationId required", 400);
  try {
    const cases = await listContinuityCases({
      organisationId: parsed.data.organisationId,
      coordinatorId: parsed.data.coordinatorId,
      participantId: parsed.data.participantId,
      limit: parsed.data.limit,
      cursorId: parsed.data.cursorId,
    });
    return jsonOk({ cases });
  } catch (err) {
    return jsonError((err as Error).message ?? "LIST_ERROR", 400);
  }
}

const createSchema = z.object({
  action: z.literal("open").default("open"),
  organisationId: z.string().optional(),
  participantId: z.string().min(1),
  category: z.enum([
    "care",
    "transport",
    "appointment_non_clinical",
    "employment",
    "housing",
    "provider_failure",
    "finance_recovery",
    "civic_disruption",
    "life_event",
    "other",
  ]),
  title: z.string().min(1),
  summary: z.string().optional(),
  coordinatorId: z.string().optional(),
  linkedCaseId: z.string().optional(),
  signalIds: z.array(z.string()).optional(),
});

const transitionSchema = z.object({
  action: z.literal("transition"),
  caseId: z.string(),
  toStatus: z.enum([
    "open",
    "triage",
    "planning",
    "awaiting_approval",
    "in_recovery",
    "monitoring",
    "resolved",
    "closed",
    "abandoned",
  ]),
  narrative: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  if (raw && raw.action === "transition") {
    const parsed = transitionSchema.safeParse(raw);
    if (!parsed.success) return jsonError("Invalid transition payload", 400);
    try {
      const c = await transitionContinuityCase({
        caseId: parsed.data.caseId,
        toStatus: parsed.data.toStatus,
        actorUserId: user.id,
        narrative: parsed.data.narrative,
      });
      return jsonOk({ case: c });
    } catch (err) {
      return jsonError((err as Error).message ?? "TRANSITION_ERROR", 400);
    }
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid case payload", 400);
  try {
    const c = await openOrExtendContinuityCase({
      participantId: parsed.data.participantId,
      organisationId: parsed.data.organisationId,
      category: parsed.data.category,
      title: parsed.data.title,
      summary: parsed.data.summary,
      coordinatorId: parsed.data.coordinatorId,
      linkedCaseId: parsed.data.linkedCaseId,
      signalIds: parsed.data.signalIds,
      openedById: user.id,
    });
    return jsonOk({ case: c }, 201);
  } catch (err) {
    return jsonError((err as Error).message ?? "OPEN_ERROR", 400);
  }
}
