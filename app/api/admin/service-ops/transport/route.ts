import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("admin:service-ops");
  if (user instanceof Response) return user;
  const bookings = await prisma.transportBooking.findMany({
    where: {
      OR: [
        { status: "quote_requested" },
        {
          status: { in: ["provider_accepted", "driver_assigned"] },
          vehicleId: null,
        },
      ],
    },
    include: { vehicle: true, operatorOrganisation: true },
    take: 50,
  });
  return jsonOk({ bookings });
}
