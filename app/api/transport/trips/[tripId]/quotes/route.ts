import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import {
  createOperatorQuote,
  listSandboxQuotesForTrip,
} from "@/lib/transport/transport-quote-service";
import { createOperatorQuoteSchema } from "@/lib/validation/transport-quote-schemas";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const { tripId } = await params;
    const result = await listSandboxQuotesForTrip(user, tripId);
    return jsonOk(result);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  try {
    const { tripId } = await params;
    const body = createOperatorQuoteSchema.parse(await req.json());
    const membership = await prisma.organisationMember.findFirst({
      where: { userId: user.id },
      select: { organisationId: true },
    });
    if (!membership) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const quote = await createOperatorQuote(user, {
      ...body,
      tripId,
      operatorOrganisationId: membership.organisationId,
    });
    return jsonOk({ quote }, 201);
  } catch (e) {
    if (e instanceof ZodError) return handleTransportRouteError(e);
    return handleTransportRouteError(e);
  }
}
