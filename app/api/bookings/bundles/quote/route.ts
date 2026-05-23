import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { quoteBundle } from "@/lib/orchestration/care-transport-bundle-orchestrator";

const schema = z.object({
  journeyStart: z.string().datetime(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const quote = await quoteBundle({
    participantId: user.id,
    journeyStart: new Date(body.journeyStart),
  });
  return jsonOk({ quote });
}
