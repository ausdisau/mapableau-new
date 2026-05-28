import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createAvailabilityWindow,
  listAvailability,
} from "@/lib/availability/availability-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("availability:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const windows = await listAvailability(orgId);
  return jsonOk({ windows });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("availability:manage:org");
  if (user instanceof Response) return user;
  const body = await req.json();
  const window = await createAvailabilityWindow({
    organisationId: body.organisationId,
    workerProfileId: body.workerProfileId,
    driverProfileId: body.driverProfileId,
    vehicleId: body.vehicleId,
    dayOfWeek: body.dayOfWeek,
    startTime: body.startTime,
    endTime: body.endTime,
    timezone: body.timezone,
  });
  return jsonOk({ window }, 201);
}
