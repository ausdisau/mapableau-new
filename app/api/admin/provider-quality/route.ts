import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const profiles = await prisma.providerQualityProfile.findMany({
    take: 50,
    include: { signals: true },
    orderBy: { updatedAt: "desc" },
  });
  return jsonOk({ profiles });
}
