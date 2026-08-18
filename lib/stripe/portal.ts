import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe/client";
import { stripeConfig } from "@/lib/stripe/config";

const MAPABLE_PORTAL_META = "billing_portal_v1";

let cachedConfigurationId: string | null = null;

export type BillingPortalFlow =
  | { type: "payment_method_update" }
  | { type: "subscription_cancel"; subscriptionId: string }
  | { type: "subscription_update"; subscriptionId: string };

export function resetBillingPortalConfigCache() {
  cachedConfigurationId = null;
}

export function billingPortalReturnUrl(appUrl = stripeConfig.appUrl): string {
  return `${appUrl}/billing/settings?portal=returned`;
}

async function portalSubscriptionProducts(
  stripe: Stripe
): Promise<Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.Product[]> {
  const priceIds = [
    stripeConfig.providerProPriceId,
    stripeConfig.employerProPriceId,
  ].filter((id): id is string => Boolean(id));

  const products: Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.Product[] =
    [];

  for (const priceId of priceIds) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      const productId =
        typeof price.product === "string" ? price.product : price.product.id;
      const existing = products.find((item) => item.product === productId);
      if (existing) {
        if (!existing.prices.includes(priceId)) existing.prices.push(priceId);
      } else {
        products.push({ product: productId, prices: [priceId] });
      }
    } catch {
      // Price IDs may be unset or invalid in local/dev — skip subscription_update products.
    }
  }

  return products;
}

export async function getOrCreateBillingPortalConfiguration(): Promise<string> {
  if (stripeConfig.billingPortalConfigurationId) {
    return stripeConfig.billingPortalConfigurationId;
  }
  if (cachedConfigurationId) return cachedConfigurationId;

  const stripe = getStripeClient();
  const existing = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });
  const match = existing.data.find(
    (config) => config.metadata?.mapable === MAPABLE_PORTAL_META
  );
  if (match) {
    cachedConfigurationId = match.id;
    return match.id;
  }

  const products = await portalSubscriptionProducts(stripe);
  const created = await stripe.billingPortal.configurations.create({
    name: "MapAble billing portal",
    business_profile: {
      headline: "Manage your MapAble billing",
      privacy_policy_url: `${stripeConfig.appUrl}/privacy`,
      terms_of_service_url: `${stripeConfig.appUrl}/terms`,
    },
    default_return_url: billingPortalReturnUrl(),
    metadata: { mapable: MAPABLE_PORTAL_META },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "address", "name"],
      },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
      },
      subscription_update: products.length
        ? {
            enabled: true,
            default_allowed_updates: ["price"],
            products,
          }
        : { enabled: false },
    },
  });

  cachedConfigurationId = created.id;
  return created.id;
}

async function resolvePortalConfigurationId(): Promise<string | undefined> {
  try {
    return await getOrCreateBillingPortalConfiguration();
  } catch {
    return undefined;
  }
}

function toFlowData(
  flow: BillingPortalFlow
): Stripe.BillingPortal.SessionCreateParams.FlowData {
  switch (flow.type) {
    case "payment_method_update":
      return { type: "payment_method_update" };
    case "subscription_cancel":
      return {
        type: "subscription_cancel",
        subscription_cancel: { subscription: flow.subscriptionId },
      };
    case "subscription_update":
      return {
        type: "subscription_update",
        subscription_update: { subscription: flow.subscriptionId },
      };
    default: {
      const _exhaustive: never = flow;
      return _exhaustive;
    }
  }
}

export async function createBillingPortalSession(
  stripeCustomerId: string,
  options?: { flow?: BillingPortalFlow }
) {
  const stripe = getStripeClient();
  const configuration = await resolvePortalConfigurationId();
  const params: Stripe.BillingPortal.SessionCreateParams = {
    customer: stripeCustomerId,
    return_url: billingPortalReturnUrl(),
  };
  if (configuration) {
    params.configuration = configuration;
  }
  if (options?.flow) {
    params.flow_data = toFlowData(options.flow);
  }
  return stripe.billingPortal.sessions.create(params);
}
