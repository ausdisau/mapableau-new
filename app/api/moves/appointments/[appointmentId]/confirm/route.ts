import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { confirmTherapyAppointment } from "@/lib/moves/therapy-booking-service";

type Params = { params: Promise<{ appointmentId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { appointmentId } = await params;
  try {
    const appointment = await confirmTherapyAppointment(appointmentId, user.id);
    return jsonOk({ appointment });
  } catch {
    return jsonError("Confirm failed", 500);
  }
}
