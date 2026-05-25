import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { convertQuoteToBooking } from "@/lib/quotes/quote-conversion-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const booking = await convertQuoteToBooking({
    quoteRequestId: id,
    actorUserId: user.id,
  });
  return jsonOk({ booking });
}
