import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createDriverProfile } from "@/lib/transport/driver-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const drivers = await prisma.driverProfile.findMany({ take: 100 });
  return jsonOk({ drivers });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("driver:manage:org");
  if (user instanceof Response) return user;
  const body = await req.json();
  const driver = await createDriverProfile({
    userId: body.userId,
    organisationId: body.organisationId,
    displayName: body.displayName,
    phone: body.phone,
    serviceRegions: body.serviceRegions,
    actorUserId: user.id,
  });
  return jsonOk({ driver }, 201);
}
