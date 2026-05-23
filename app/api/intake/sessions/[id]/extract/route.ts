import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const session = await prisma.intakeSession.findFirst({
    where: { id, participantId: user.id },
    include: { messages: true },
  });
  if (!session) return jsonError("Not found", 404);

  const text = session.messages.map((m) => m.content).join(" ");
  const extraction = {
    supportType: text.toLowerCase().includes("transport")
      ? "transport"
      : text.toLowerCase().includes("care")
        ? "care"
        : "provider_referral",
    draftSummary: text.slice(0, 500),
    uncertainties: ["Please review and edit before creating any booking."],
  };

  await prisma.intakeSession.update({
    where: { id },
    data: { extractionJson: extraction },
  });

  return jsonOk({ extraction });
}
