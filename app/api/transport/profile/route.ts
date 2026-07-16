import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getTransportAccessProfile,
  toAccessPassSummary,
  upsertTransportAccessProfile,
} from "@/lib/transport/transport-access-profile-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { transportAccessProfileUpdateSchema } from "@/lib/validation/transport-access-profile-schemas";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const profile = await getTransportAccessProfile(user);
    return jsonOk({
      profile: profile ? toAccessPassSummary(profile) : null,
    });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function PUT(req: Request) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = transportAccessProfileUpdateSchema.parse(await req.json());
    const profile = await upsertTransportAccessProfile(user, body);
    return jsonOk({ profile: toAccessPassSummary(profile) });
  } catch (e) {
    if (e instanceof ZodError) return handleTransportRouteError(e);
    return handleTransportRouteError(e);
  }
}
