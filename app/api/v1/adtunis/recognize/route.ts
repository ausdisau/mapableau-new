
import { recognizeAudio } from "@/lib/adtunis/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { adtunisConfig } from "@/lib/config/adtunis";
import { AdtunisActionError } from "@mapable/adtunis-core";

export async function POST(req: Request) {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const contentType = req.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!/^audio\/[a-z0-9.+-]+$/i.test(contentType)) {
    return jsonError("Send a supported audio recording.", 415);
  }

  try {
    const buffer = Buffer.from(await req.arrayBuffer());
    const workspace = await recognizeAudio({
      participantId: user.id,
      audio: buffer,
      contentType,
    });
    return jsonOk(workspace);
  } catch (error) {
    if (error instanceof AdtunisActionError) {
      return jsonError(error.message, error.status);
    }
    return jsonError(
      error instanceof Error ? error.message : "Recognition failed.",
      502,
    );
  }
}
