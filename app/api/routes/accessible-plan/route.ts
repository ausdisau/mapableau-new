import { z } from "zod";

import { jsonOk } from "@/lib/api/response";
import { planAccessibleRoute } from "@/lib/routing/routing-adapter";

const schema = z.object({
  origin: z.object({ lat: z.number(), lng: z.number() }),
  destination: z.object({ lat: z.number(), lng: z.number() }),
  wheelchairPreferred: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const plan = await planAccessibleRoute(body);
  return jsonOk({ plan });
}
