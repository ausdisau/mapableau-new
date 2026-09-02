import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createCoDesignProgramme,
  listCoDesignProgrammes,
} from "@/lib/research/co-design-governance-service";
import { createCoDesignProgrammeInputSchema } from "@mapable/research";

export async function GET() {
  const result = await listCoDesignProgrammes(50);
  return jsonOk(result);
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    return jsonBodyErrorResponse(e);
  }

  const parsed = createCoDesignProgrammeInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid programme payload", 400);
  }

  try {
    const programme = await createCoDesignProgramme(parsed.data);
    return jsonOk({ programme }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "RESEARCH_GOVERNANCE_DISABLED") {
      return jsonError("Research governance is disabled", 503);
    }
    throw error;
  }
}
