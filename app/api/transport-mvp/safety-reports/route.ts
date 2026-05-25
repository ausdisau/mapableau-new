import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { reportTransportSafetyIssue } from "@/lib/transport-mvp/safety-report-service";
import { safetyReportSchema } from "@/lib/validation/transport-mvp";

export async function POST(req: Request) {
  const user = await requireApiPermission("incident:create");
  if (user instanceof Response) return user;

  try {
    const parsed = safetyReportSchema.parse(await req.json());
    const incident = await reportTransportSafetyIssue({
      reportedById: user.id,
      title: parsed.title,
      description: parsed.description,
      severity: parsed.severity,
      tripId: parsed.tripId,
      immediateRiskPresent: parsed.immediateRiskPresent,
    });
    return jsonOk({ incident }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "INCIDENTS_DISABLED") {
      return jsonError("Incident reporting is disabled", 503);
    }
    return jsonError("Report failed", 500);
  }
}
