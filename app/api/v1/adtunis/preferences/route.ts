import { ZodError , z } from "zod";


import { getWorkspace, performWorkspaceAction } from "@/lib/adtunis/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { adtunisConfig } from "@/lib/config/adtunis";
import { adtunisAccessibilitySchema, audioRetentionSchema } from "@mapable/adtunis-core";

const patchSchema = z
  .object({
    accessibility: adtunisAccessibilitySchema.optional(),
    audioRetention: audioRetentionSchema.optional(),
  })
  .strict();

export async function GET() {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const workspace = await getWorkspace(user.id);
  return jsonOk({
    accessibility: workspace.accessibility,
    audioRetention: workspace.audioRetention,
  });
}

export async function PATCH(req: Request) {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const body = patchSchema.parse(await req.json());
    let workspace = await getWorkspace(user.id);
    if (body.accessibility) {
      workspace = await performWorkspaceAction(user.id, {
        type: "saveAccessibility",
        accessibility: body.accessibility,
      });
    }
    if (body.audioRetention) {
      workspace = await performWorkspaceAction(user.id, {
        type: "saveAudioRetention",
        audioRetention: body.audioRetention,
      });
    }
    return jsonOk({
      accessibility: workspace.accessibility,
      audioRetention: workspace.audioRetention,
    });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("Unable to update preferences.", 400);
  }
}
