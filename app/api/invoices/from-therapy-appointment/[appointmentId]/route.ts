import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createInvoiceFromTherapyAppointment } from "@/lib/moves/moves-invoice-service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ appointmentId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { appointmentId } = await params;
  const appt = await prisma.therapyAppointment.findFirst({
    where: { id: appointmentId, participantId: user.id },
  });
  if (!appt) return jsonError("Not found", 404);
  try {
    const invoice = await createInvoiceFromTherapyAppointment(
      appointmentId,
      user.id,
    );
    return jsonOk({ invoice }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "APPOINTMENT_NOT_COMPLETED") {
      return jsonError("Appointment must be completed first", 400);
    }
    return jsonError("Invoice creation failed", 500);
  }
}
