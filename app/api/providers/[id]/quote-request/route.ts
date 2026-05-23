import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  message: z.string().min(10).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = schema.parse(await req.json());

  const quote = await prisma.directoryQuoteRequest.create({
    data: {
      directoryProviderId: id,
      requesterUserId: user.id,
      message: body.message,
    },
  });

  return jsonOk({ quoteRequest: quote });
}
