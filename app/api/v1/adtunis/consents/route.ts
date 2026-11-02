import { ZodError } from "zod";


import { readMapAbleAdtunisConsent } from "@/lib/adtunis/consent-adapter";
import { performWorkspaceAction } from "@/lib/adtunis/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { adtunisConfig } from "@/lib/config/adtunis";
import { adtunisConsentSchema } from "@mapable/adtunis-core";

export async function GET() {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  return jsonOk(await readMapAbleAdtunisConsent(user.id));
}

export async function POST(req: Request) {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const consent = adtunisConsentSchema.parse(await req.json());
    const workspace = await performWorkspaceAction(user.id, {
      type: "saveConsent",
      consent,
    });
    return jsonOk({ consent: workspace.consent, workspace });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("Unable to save consents.", 400);
  }
}
