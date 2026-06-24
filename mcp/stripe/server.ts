#!/usr/bin/env npx tsx
/**
 * MapAble Stripe MCP server — stdio transport for Cursor and other MCP hosts.
 * Exposes billing governance, funding checkout rules, configuration status,
 * metadata helpers, and read-only Stripe object lookups.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  BILLING_FUNDING_SOURCE_TYPES,
  buildCheckoutMetadataPreview,
  evaluateFundingCheckout,
  getStripeConfigurationStatus,
  mapableBillingApiReference,
  STRIPE_MCP_GOVERNANCE,
} from "../../lib/stripe/mcp-reference";
import { getStripeClient } from "../../lib/stripe/client";
import { isStripeSdkAvailable } from "../../lib/stripe/config";
import { isStripeNotConfiguredError } from "../../lib/stripe/errors";

const fundingTypeSchema = z.enum(BILLING_FUNDING_SOURCE_TYPES);

const server = new McpServer({
  name: "mapable-stripe",
  version: STRIPE_MCP_GOVERNANCE.version,
});

function jsonText(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function stripeNotConfiguredToolResponse() {
  return {
    ...jsonText({
      configured: false,
      error: "STRIPE_NOT_CONFIGURED",
      message: "Set STRIPE_SECRET_KEY in the host environment (.env via envFile).",
    }),
    isError: true as const,
  };
}

function stripeToolError(message: string) {
  return {
    ...jsonText({ error: message }),
    isError: true as const,
  };
}

server.tool(
  "stripe_get_billing_framework",
  "Returns MapAble Stripe billing governance: human-in-the-loop rules, non-goals, library layout, and documentation pointers.",
  {},
  async () =>
    jsonText({
      governance: STRIPE_MCP_GOVERNANCE,
      paymentFlows: {
        planManagedNdis:
          "Funding source ndis_plan_managed — export to plan manager (CSV / plan_manager JSON), no Stripe Checkout.",
        selfManagedOrPrivate:
          "Funding source ndis_self_managed or private_card — Stripe Checkout; webhook checkout.session.completed marks paid.",
        connectDestinationCharge:
          "When provider has stripeConnectedAccountId, Checkout uses application_fee_amount and transfer_data.destination.",
      },
      pci: "No card data stored locally; use Stripe-hosted Checkout and Billing Portal only.",
    })
);

server.tool(
  "stripe_get_configuration_status",
  "Reports whether Stripe is configured in the host environment (no secret values returned).",
  {},
  async () => jsonText(getStripeConfigurationStatus())
);

server.tool(
  "stripe_check_funding_checkout",
  "Evaluates whether a billing funding source type may use Stripe Checkout under MapAble rules.",
  {
    fundingType: fundingTypeSchema
      .optional()
      .describe(
        "BillingFundingSourceType; omit to represent no funding source selected"
      ),
  },
  async ({ fundingType }) => jsonText(evaluateFundingCheckout(fundingType))
);

server.tool(
  "stripe_build_checkout_metadata",
  "Builds stable Stripe Checkout metadata keys for billing-core or legacy invoice flows (preview only, no API call).",
  {
    mode: z.enum(["billing", "legacy"]).describe("billing-core vs legacy Invoice flow"),
    invoiceId: z.string().describe("MapAble invoice id"),
    userId: z.string().describe("MapAble user id"),
    serviceType: z.string().optional().describe("billing-core service type"),
    bookingId: z.string().optional().describe("Optional booking id"),
    purpose: z
      .enum([
        "participant_private_pay",
        "participant_copay",
        "provider_subscription",
        "employer_subscription",
        "other",
      ])
      .optional()
      .describe("Legacy StripePaymentPurpose when mode=legacy"),
  },
  async (input) =>
    jsonText({
      mode: input.mode,
      metadata: buildCheckoutMetadataPreview(input),
      note: "Metadata preview only. Creating Checkout requires explicit user approval via MapAble API or dashboard.",
    })
);

server.tool(
  "stripe_get_customer",
  "Read-only: retrieves a Stripe Customer by id (requires STRIPE_SECRET_KEY).",
  {
    customerId: z.string().describe("Stripe customer id, e.g. cus_..."),
  },
  async ({ customerId }) => {
    if (!isStripeSdkAvailable()) return stripeNotConfiguredToolResponse();
    try {
      const stripe = getStripeClient();
      const customer = await stripe.customers.retrieve(customerId);
      return jsonText({ customer });
    } catch (err) {
      if (isStripeNotConfiguredError(err)) return stripeNotConfiguredToolResponse();
      const message = err instanceof Error ? err.message : "Stripe customer lookup failed";
      return stripeToolError(message);
    }
  }
);

server.tool(
  "stripe_get_checkout_session",
  "Read-only: retrieves a Stripe Checkout Session by id (requires STRIPE_SECRET_KEY).",
  {
    sessionId: z.string().describe("Stripe Checkout Session id, e.g. cs_..."),
  },
  async ({ sessionId }) => {
    if (!isStripeSdkAvailable()) return stripeNotConfiguredToolResponse();
    try {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return jsonText({ session });
    } catch (err) {
      if (isStripeNotConfiguredError(err)) return stripeNotConfiguredToolResponse();
      const message =
        err instanceof Error ? err.message : "Stripe Checkout Session lookup failed";
      return stripeToolError(message);
    }
  }
);

server.tool(
  "stripe_get_payment_intent",
  "Read-only: retrieves a Stripe PaymentIntent by id (requires STRIPE_SECRET_KEY).",
  {
    paymentIntentId: z.string().describe("Stripe PaymentIntent id, e.g. pi_..."),
  },
  async ({ paymentIntentId }) => {
    if (!isStripeSdkAvailable()) return stripeNotConfiguredToolResponse();
    try {
      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return jsonText({ paymentIntent });
    } catch (err) {
      if (isStripeNotConfiguredError(err)) return stripeNotConfiguredToolResponse();
      const message =
        err instanceof Error ? err.message : "Stripe PaymentIntent lookup failed";
      return stripeToolError(message);
    }
  }
);

server.tool(
  "stripe_mapable_billing_api_reference",
  "Lists MapAble billing HTTP API paths agents can call when base URL and auth are configured.",
  {},
  async () => {
    const base =
      process.env.MAPABLE_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      undefined;
    return jsonText(mapableBillingApiReference(base));
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("mapable-stripe MCP server failed:", err);
  process.exit(1);
});
