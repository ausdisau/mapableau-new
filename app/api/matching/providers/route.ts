import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { rankProviders } from "@/lib/matching/provider-matching";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const orgs = await prisma.organisation.findMany({
    where: { status: "active" },
    take: 20,
  });

  const ranked = rankProviders(
    orgs.map((o) => ({
      id: o.id,
      verificationStatus: o.verificationStatus,
      status: o.status,
    }))
  );

  return jsonOk({ candidates: ranked });
}
