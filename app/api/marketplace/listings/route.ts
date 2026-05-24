import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  listingType: z.enum(["buy", "sell", "rent"]),
  category: z.string().optional(),
  priceCents: z.number().int().optional(),
  ndisNotes: z.string().optional(),
});

export async function GET() {
  const listings = await prisma.atMarketplaceListing.findMany({
    where: { status: "published" },
    take: 50,
  });
  return jsonOk({ listings });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const listing = await prisma.atMarketplaceListing.create({
    data: {
      sellerUserId: user.id,
      ...body,
      status: "draft",
    },
  });
  return jsonOk({ listing });
}
