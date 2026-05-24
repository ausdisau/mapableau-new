import {
  getAdvertiserForOrganisation,
  listAdvertisersForUser,
  upsertAdvertiser,
} from "@/lib/ads/advertiser-service";
import { createAdvertiserSchema } from "@/lib/ads/schemas";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("organisationId");

  if (organisationId) {
    const advertiser = await getAdvertiserForOrganisation(organisationId);
    return jsonOk({ advertiser });
  }

  const advertisers = await listAdvertisersForUser(user.id);
  return jsonOk({ advertisers });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = createAdvertiserSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await upsertAdvertiser(user, parsed.data);
  if (!result.ok) return jsonError(result.error, 400);

  return jsonOk({ advertiser: result.advertiser }, 201);
}
