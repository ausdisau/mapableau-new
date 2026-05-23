import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const shifts = await prisma.careShift.findMany({
    where: {
      workerProfile: { userId: user.id },
      startAt: { gte: today, lt: tomorrow },
    },
    orderBy: { startAt: "asc" },
  });

  return jsonOk({ shifts });
}
