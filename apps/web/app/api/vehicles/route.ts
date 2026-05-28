import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createVehicle } from "@/lib/transport/vehicle-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const vehicles = await prisma.vehicle.findMany({ take: 100 });
  return jsonOk({ vehicles });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("vehicle:manage:org");
  if (user instanceof Response) return user;
  const body = await req.json();
  const vehicle = await createVehicle({
    organisationId: body.organisationId,
    displayName: body.displayName,
    vehicleType: body.vehicleType,
    registrationNumber: body.registrationNumber,
    wheelchairAccessible: body.wheelchairAccessible,
    rampAvailable: body.rampAvailable,
    liftAvailable: body.liftAvailable,
    actorUserId: user.id,
  });
  return jsonOk({ vehicle }, 201);
}
