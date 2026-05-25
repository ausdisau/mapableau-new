import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  declareProviderCapacity,
  listProviderCapacity,
} from "@/lib/capacity/provider-capacity-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });
  if (!membership) return jsonOk({ capacity: [] });
  const capacity = await listProviderCapacity(membership.organisationId);
  return jsonOk({ capacity });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });
  if (!membership) return jsonError("No organisation", 403);
  const body = await req.json();
  const block = await declareProviderCapacity({
    organisationId: membership.organisationId,
    serviceType: body.serviceType,
    locationRadiusKm: body.locationRadiusKm,
    availableDates: body.availableDates,
    accessCapabilities: body.accessCapabilities,
    workerCount: body.workerCount,
    acceptingNewParticipants: body.acceptingNewParticipants,
    verificationRequiredLevel: body.verificationRequiredLevel,
    actorUserId: user.id,
  });
  return jsonOk({ capacity: block }, 201);
}
