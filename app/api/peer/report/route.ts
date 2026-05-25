import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { createPeerReport } from "@/lib/peer/peer-report-service";
import { createPeerReportSchema } from "@/lib/validation/peer";

export async function POST(req: Request) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  try {
    const body = createPeerReportSchema.parse(await req.json());
    const report = await createPeerReport(
      ctx.profile.id,
      ctx.user.id,
      body
    );
    return jsonOk({ report: { id: report.id } }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not submit report", 400);
  }
}
