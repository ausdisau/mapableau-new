import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { submitQuoteResponse } from "@/lib/quotes/quote-response-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });
  if (!membership) return jsonError("No organisation", 403);
  const { id } = await params;
  const body = await req.json();
  const response = await submitQuoteResponse({
    quoteRequestId: id,
    organisationId: membership.organisationId,
    totalCents: body.totalCents,
    notes: body.notes,
    lineItems: body.lineItems ?? [],
    actorUserId: user.id,
  });
  return jsonOk({ response }, 201);
}
