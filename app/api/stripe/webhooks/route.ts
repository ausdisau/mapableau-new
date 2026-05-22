import { jsonOk } from "@/lib/api/response";
import { isStripeConfigured } from "@/lib/config/phase2";
import { processStripeWebhookEvent } from "@/lib/stripe/stripe-service";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return jsonOk({ received: false, message: "Payments not configured" });
  }

  const payload = await req.json();
  const eventId = payload?.id ?? `evt_${Date.now()}`;
  const eventType = payload?.type ?? "unknown";

  const result = await processStripeWebhookEvent(eventId, eventType, payload);
  return jsonOk({ received: true, ...result });
}
