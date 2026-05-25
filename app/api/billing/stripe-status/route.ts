import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getStripeClient } from "@/lib/stripe/client";
import {
  isStripeIntegrationEnabled,
  isStripeSdkAvailable,
  stripeConfig,
} from "@/lib/stripe/config";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const ping = new URL(req.url).searchParams.get("ping") === "1";

  const status = {
    sdkAvailable: isStripeSdkAvailable(),
    integrationEnabled: isStripeIntegrationEnabled(),
    webhookSecretSet: Boolean(stripeConfig.webhookSecret),
    connectClientIdSet: Boolean(stripeConfig.connectClientId),
    providerProPriceIdSet: Boolean(stripeConfig.providerProPriceId),
    employerProPriceIdSet: Boolean(stripeConfig.employerProPriceId),
    appUrl: stripeConfig.appUrl,
    defaultCurrency: stripeConfig.defaultCurrency,
  };

  if (!ping) {
    return jsonOk({ stripe: status });
  }

  if (!isStripeSdkAvailable()) {
    return jsonError(
      "Stripe secret key not configured. Set STRIPE_SECRET_KEY in .env.",
      503
    );
  }

  try {
    const stripe = getStripeClient();
    const balance = await stripe.balance.retrieve();
    return jsonOk({
      stripe: status,
      ping: {
        ok: true,
        livemode: balance.livemode,
        currency: balance.available[0]?.currency ?? stripeConfig.defaultCurrency,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe API error";
    return jsonError(message, 502);
  }
}
