import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { toPeerProfileDto } from "@/lib/peer/dto";
import { requirePeerApiUser, requirePeerProfileApi } from "@/lib/peer/api-helpers";
import {
  createPeerProfile,
  getPeerProfileByUserId,
  updatePeerProfile,
} from "@/lib/peer/peer-profile-service";
import {
  createPeerProfileSchema,
  updatePeerProfileSchema,
} from "@/lib/validation/peer";

export async function GET() {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;

  const profile = await getPeerProfileByUserId(user.id);
  if (!profile) return jsonOk({ profile: null });
  return jsonOk({ profile: toPeerProfileDto(profile, profile.user) });
}

export async function POST(req: Request) {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;

  try {
    const body = createPeerProfileSchema.parse(await req.json());
    const profile = await createPeerProfile(user.id, body);
    return jsonOk({ profile: toPeerProfileDto(profile, profile.user) }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create profile", 400);
  }
}

export async function PATCH(req: Request) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;

  try {
    const body = updatePeerProfileSchema.parse(await req.json());
    const profile = await updatePeerProfile(
      ctx.user.id,
      ctx.profile.id,
      body
    );
    return jsonOk({ profile: toPeerProfileDto(profile, profile.user) });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update profile", 400);
  }
}
