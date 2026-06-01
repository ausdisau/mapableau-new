/**
 * Verify Stripe credentials in .env (loads via shell: set -a && source .env).
 *
 *   pnpm stripe:verify
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { getStripeClient, resetStripeClientForTests } from "@/lib/stripe/client";
import {
  isStripeIntegrationEnabled,
  isStripeSdkAvailable,
  stripeConfig,
} from "@/lib/stripe/config";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvFile();
  resetStripeClientForTests();

  console.log("Stripe configuration");
  console.log("  STRIPE_SECRET_KEY set:", isStripeSdkAvailable());
  console.log("  STRIPE_WEBHOOK_SECRET set:", Boolean(stripeConfig.webhookSecret));
  console.log("  Integration enabled (legacy):", isStripeIntegrationEnabled());
  console.log("  BILLING_ENABLE_STRIPE:", process.env.BILLING_ENABLE_STRIPE);
  console.log("  STRIPE_ENABLED:", process.env.STRIPE_ENABLED);
  console.log("  App URL:", stripeConfig.appUrl);

  if (!isStripeSdkAvailable()) {
    console.error(
      "\nMissing STRIPE_SECRET_KEY. Add sk_test_... to .env (see docs/stripe-connect.md)."
    );
    process.exit(1);
  }

  const stripe = getStripeClient();
  const balance = await stripe.balance.retrieve();
  console.log("\nStripe API connection OK");
  console.log("  Livemode:", balance.livemode);
  console.log(
    "  Available balance:",
    balance.available.map((b) => `${b.amount} ${b.currency}`).join(", ") || "0"
  );

  if (!isStripeIntegrationEnabled()) {
    console.warn(
      "\nWarning: BILLING_ENABLE_STRIPE and STRIPE_ENABLED are false — legacy routes stay disabled."
    );
  }
  if (!stripeConfig.webhookSecret) {
    console.warn(
      "Warning: STRIPE_WEBHOOK_SECRET unset — webhooks will fail until you set it (stripe listen)."
    );
  }
}

main().catch((e) => {
  console.error("\nStripe verification failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
