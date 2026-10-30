import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { isSameOriginMutation } from "@/lib/provider/finder/same-origin";
import {
  isProviderSearchProfileEnabled,
  saveProviderSearchProfileSchema,
} from "@/lib/provider/finder/search-profile-contract";
import {
  deleteProviderSearchProfile,
  readProviderSearchProfile,
  saveProviderSearchProfile,
} from "@/lib/provider/finder/search-profile-service";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store" };

function unavailable() {
  return Response.json({ error: "Saved matching preferences are not enabled" }, { status: 503, headers: noStore });
}
function fail() {
  return Response.json({ error: "Saved preferences are temporarily unavailable" }, { status: 503, headers: noStore });
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isProviderSearchProfileEnabled()) return unavailable();
  try {
    const profile = await readProviderSearchProfile(user.id);
    return Response.json({ profile }, { headers: noStore });
  } catch {
    return fail();
  }
}

export async function PUT(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isProviderSearchProfileEnabled()) return unavailable();
  if (!isSameOriginMutation(request)) {
    return Response.json({ error: "Origin not allowed" }, { status: 403, headers: noStore });
  }
  if (!checkIpRateLimit("provider-profile:" + user.id + ":" + getClientIp(request), { windowMs: 60_000, max: 8 })) {
    return Response.json({ error: "Too many updates" }, { status: 429, headers: noStore });
  }
  try {
    const input = saveProviderSearchProfileSchema.parse(await request.json());
    const profile = await saveProviderSearchProfile({
      userId: user.id, actorRole: user.primaryRole, preferences: input.preferences,
    });
    return Response.json({ profile }, { headers: noStore });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid preferences or consent" }, { status: 400, headers: noStore });
    }
    return fail();
  }
}

export async function DELETE(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isProviderSearchProfileEnabled()) return unavailable();
  if (!isSameOriginMutation(request)) {
    return Response.json({ error: "Origin not allowed" }, { status: 403, headers: noStore });
  }
  try {
    await deleteProviderSearchProfile({ userId: user.id, actorRole: user.primaryRole });
    return Response.json({ removed: true }, { headers: noStore });
  } catch {
    return fail();
  }
}
