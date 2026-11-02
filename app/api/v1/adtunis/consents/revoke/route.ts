import { performWorkspaceAction } from "@/lib/adtunis/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { adtunisConfig } from "@/lib/config/adtunis";

export async function POST() {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const workspace = await performWorkspaceAction(user.id, {
    type: "saveConsent",
    consent: {
      transcription: false,
      personalisation: false,
      research: false,
    },
  });
  return jsonOk({
    consent: workspace.consent,
    message: "Adtunis consents revoked for this participant.",
  });
}
