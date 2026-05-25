import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getTherapyAppointment } from "@/lib/moves/therapy-booking-service";

type Params = { params: Promise<{ appointmentId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { appointmentId } = await params;
  const appointment = await getTherapyAppointment(appointmentId, user.id);
  if (!appointment) return jsonError("Not found", 404);
  return jsonOk({ appointment });
}
