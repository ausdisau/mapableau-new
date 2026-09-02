import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
} from "@paypal/paypal-server-sdk";

import { isPayPalConfigured, paypalConfig } from "@/lib/paypal/config";

let ordersController: OrdersController | null = null;

function getOrdersController(): OrdersController | null {
  if (!isPayPalConfigured()) {
    return null;
  }
  if (ordersController) {
    return ordersController;
  }

  const client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: paypalConfig.clientId!,
      oAuthClientSecret: paypalConfig.clientSecret!,
    },
    timeout: 0,
    environment: paypalConfig.useProduction
      ? Environment.Production
      : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true },
    },
  });

  ordersController = new OrdersController(client);
  return ordersController;
}

export type CreateDonationOrderResult = {
  jsonResponse: unknown;
  httpStatusCode: number;
};

/**
 * Create a PayPal order for a header donation (Standard Checkout sample).
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
export async function createDonationOrder(): Promise<CreateDonationOrderResult> {
  const controller = getOrdersController();
  if (!controller) {
    throw new Error("PayPal not configured");
  }

  const amount = paypalConfig.donationAmount;
  const currencyCode = paypalConfig.currency;

  const collect = {
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode,
            value: amount,
            breakdown: {
              itemTotal: {
                currencyCode,
                value: amount,
              },
            },
          },
          items: [
            {
              name: "MapAble donation",
              unitAmount: {
                currencyCode,
                value: amount,
              },
              quantity: "1",
              description: "Donation to Australian Disability Ltd / MapAble",
              sku: "donation",
            },
          ],
        },
      ],
    },
    prefer: "return=minimal",
  };

  try {
    const { body, ...httpResponse } = await controller.createOrder(collect);
    return {
      jsonResponse: JSON.parse(String(body)),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

/**
 * Capture payment for an approved PayPal order.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
export async function captureDonationOrder(
  orderID: string,
): Promise<CreateDonationOrderResult> {
  const controller = getOrdersController();
  if (!controller) {
    throw new Error("PayPal not configured");
  }

  try {
    const { body, ...httpResponse } = await controller.captureOrder({
      id: orderID,
      prefer: "return=minimal",
    });
    return {
      jsonResponse: JSON.parse(String(body)),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}
