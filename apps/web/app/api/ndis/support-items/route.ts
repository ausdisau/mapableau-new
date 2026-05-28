import { requireApiAdmin, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const items = await prisma.ndisSupportItem.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
    take: 200,
  });
  return jsonOk({ items });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const item = await prisma.ndisSupportItem.create({
    data: {
      code: body.code,
      name: body.name,
      categoryLabel: body.category,
      unitType: body.unitType ?? "hour",
      priceCapCents: body.priceCapCents,
      effectiveFrom: body.effectiveFrom
        ? new Date(body.effectiveFrom)
        : new Date(),
      active: true,
    },
  });
  return jsonOk({ item }, 201);
}
