import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { openInfrastructureFlags } from "@/lib/integrations/access/flags";
import {
  AccessQuestError,
  normalizeQuestAnswer,
} from "@/lib/access/quests/submit";
import { listAccessQuests } from "@/lib/access/quests/types";
import { accessQuestAnswerSchema } from "@/lib/access/quests/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!openInfrastructureFlags.accessQuests) {
    return jsonError("Access Quests disabled", 404);
  }
  return jsonOk({ quests: listAccessQuests() });
}

export async function POST(req: Request) {
  if (!openInfrastructureFlags.accessQuests) {
    return jsonError("Access Quests disabled", 404);
  }
  try {
    const body = await req.json();
    const parsed = accessQuestAnswerSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const observation = normalizeQuestAnswer(parsed.data);
    return jsonOk({ observation }, 201);
  } catch (error) {
    if (error instanceof AccessQuestError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}
