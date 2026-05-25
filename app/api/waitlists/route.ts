import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createWaitlistRequest, listWaitlists } from "@/lib/capacity/waitlist-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId") ?? user.id;
  const items = await listWaitlists(participantId);
  return jsonOk({ waitlists: items });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const item = await createWaitlistRequest({
    participantId: body.participantId ?? user.id,
    requestedServiceType: body.requestedServiceType,
    accessNeeds: body.accessNeeds,
    suburb: body.suburb,
    postcode: body.postcode,
    urgencyLevel: body.urgencyLevel,
    preferredDaysTimes: body.preferredDaysTimes,
    consentToNotifyProviders: body.consentToNotifyProviders,
    createdById: user.id,
  });
  return jsonOk({ waitlist: item }, 201);
}
