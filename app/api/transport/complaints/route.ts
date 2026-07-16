import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createTransportComplaint } from "@/lib/transport/transport-complaint-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

const bodySchema = z.object({
  tripId: z.string().cuid().optional(),
  summary: z.string().min(3).max(500),
  details: z.string().max(5000).optional(),
  anonymous: z.boolean().optional(),
  advocateInvolved: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  // Complaints can be lodged while signed in; anonymous flag redacts participant link
  if (user instanceof Response) return user;
  try {
    const body = bodySchema.parse(await req.json());
    const complaint = await createTransportComplaint(user, body);
    return jsonOk({ complaint }, 201);
  } catch (e) {
    if (e instanceof ZodError) return handleTransportRouteError(e);
    return handleTransportRouteError(e);
  }
}
