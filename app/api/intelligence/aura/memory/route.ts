import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createMemoryCard,
  listMemoryCards,
} from "@/lib/aura/memory";

export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  participantWording: z.string().min(1).max(4000),
  category: z.enum([
    "interaction",
    "explanation",
    "routing",
    "supporter_involvement",
    "notification",
    "privacy",
    "mission_workflow",
  ]),
  source: z.enum([
    "participant_authored",
    "participant_confirmed_suggestion",
    "imported_with_confirmation",
  ]),
  allowedModules: z.array(z.string().max(64)).max(32),
  structuredPreference: z
    .object({
      key: z.string().max(128),
      value: z.union([
        z.boolean(),
        z.number(),
        z.string(),
        z.array(z.string()),
      ]),
    })
    .optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  // Subject ID from session only — never query/body userId (IDOR).
  const subjectUserId = user.id;
  try {
    return jsonOk({ cards: listMemoryCards(subjectUserId) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    if (message === "MAPABLE_AURA_MEMORY_DISABLED") {
      return jsonError("AURA memory is not enabled", 503);
    }
    return jsonError(message, 400);
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const subjectUserId = user.id;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = createMemoryCard({
      ...parsed.data,
      userId: subjectUserId,
    });
    return jsonOk({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    if (message === "MAPABLE_AURA_MEMORY_DISABLED") {
      return jsonError("AURA memory is not enabled", 503);
    }
    return jsonError(message, 400);
  }
}
