import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  createServiceSite,
  listServiceSites,
} from "@/lib/locations/service-site-service";
import { serviceSiteSchema } from "@/lib/validation/scheduling";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId required", 400);

  const member = await prisma.organisationMember.findFirst({
    where: { userId: user.id, organisationId },
  });
  if (!member) return jsonError("Forbidden", 403);

  const sites = await listServiceSites(organisationId);
  return jsonOk(sites);
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = serviceSiteSchema.extend({
      organisationId: z.string(),
    }).parse(await req.json());

    const member = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId: body.organisationId },
    });
    if (!member) return jsonError("Forbidden", 403);

    const site = await createServiceSite({
      organisationId: body.organisationId,
      name: body.name,
      addressPublic: body.addressPublic,
      suburb: body.suburb,
      state: body.state,
      postcode: body.postcode,
      lat: body.lat,
      lng: body.lng,
      capabilities: body.capabilities,
      actorUserId: user.id,
    });
    return jsonOk(site, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create site", 500);
  }
}
