import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  registerPushDeviceToken,
  unregisterPushDeviceToken,
} from "@/lib/notifications/notification-service";

const registerSchema = z.object({
  platform: z.string().min(1).max(32),
  token: z.string().min(1).max(4096),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = registerSchema.parse(await req.json());
    const record = await registerPushDeviceToken({
      userId: user.id,
      platform: body.platform,
      token: body.token,
    });
    return jsonOk({ id: record.id, platform: record.platform });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid push registration payload", 400);
    }
    console.error("[push/register] failed", error);
    return jsonError("Could not register push token", 500);
  }
}

export async function DELETE(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = registerSchema.parse(await req.json());
    await unregisterPushDeviceToken({
      userId: user.id,
      token: body.token,
    });
    return jsonOk({ removed: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid push deregistration payload", 400);
    }
    console.error("[push/register] delete failed", error);
    return jsonError("Could not unregister push token", 500);
  }
}
