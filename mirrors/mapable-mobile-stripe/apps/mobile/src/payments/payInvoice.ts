import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

import { MapAbleApiError, isMapAbleApiConfigured } from '../runtime/mapableApi';

export type PaymentSheetSession = {
  customerId: string;
  ephemeralKey: string;
  paymentIntentClientSecret: string;
  paymentId: string;
};

function getConfiguredBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_MAPABLE_API_URL ?? '').trim().replace(/\/+$/, '');
}

/**
 * Fetch PaymentSheet credentials from MapAble billing-core.
 * Requires EXPO_PUBLIC_MAPABLE_API_URL and a bearer/session token (no anonymous pay).
 */
export async function fetchPaymentSheetSession(params: {
  invoiceId: string;
  accessToken: string;
}): Promise<PaymentSheetSession> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    throw new MapAbleApiError('MapAble platform connection is not configured.');
  }
  if (!params.accessToken.trim()) {
    throw new MapAbleApiError('Sign in required before paying an invoice.');
  }

  const response = await fetch(`${baseUrl}/api/billing/payment-sheet`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({ invoiceId: params.invoiceId }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MapAbleApiError('MapAble returned an unreadable payment response.');
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `PaymentSheet start failed (${response.status}).`;
    throw new MapAbleApiError(message);
  }

  // Funding gate soft response
  if (
    payload &&
    typeof payload === 'object' &&
    'checkout' in payload &&
    (payload as { checkout?: { allowed?: boolean } }).checkout?.allowed === false
  ) {
    throw new MapAbleApiError(
      'This invoice cannot be paid by card or wallet. Use plan-manager export instead.',
    );
  }

  const data = payload as Record<string, unknown>;

  if (
    typeof data.customerId !== 'string' ||
    typeof data.ephemeralKey !== 'string' ||
    typeof data.paymentIntentClientSecret !== 'string' ||
    typeof data.paymentId !== 'string'
  ) {
    throw new MapAbleApiError('MapAble returned an unexpected payment-sheet payload.');
  }

  return {
    customerId: data.customerId,
    ephemeralKey: data.ephemeralKey,
    paymentIntentClientSecret: data.paymentIntentClientSecret,
    paymentId: data.paymentId,
  };
}

export async function presentCareInvoicePaymentSheet(session: PaymentSheetSession): Promise<
  | { ok: true }
  | { ok: false; cancelled: boolean; message: string }
> {
  if (!isMapAbleApiConfigured()) {
    return {
      ok: false,
      cancelled: false,
      message: 'MapAble API is not configured.',
    };
  }

  const { error: initError } = await initPaymentSheet({
    merchantDisplayName: 'MapAble / Australian Disability Ltd',
    customerId: session.customerId,
    customerEphemeralKeySecret: session.ephemeralKey,
    paymentIntentClientSecret: session.paymentIntentClientSecret,
    allowsDelayedPaymentMethods: false,
    googlePay: {
      merchantCountryCode: 'AU',
      testEnv: process.env.EXPO_PUBLIC_STRIPE_TEST_MODE !== 'false',
    },
    applePay: {
      merchantCountryCode: 'AU',
    },
    returnURL: 'mapable://stripe-redirect',
  });

  if (initError) {
    return { ok: false, cancelled: false, message: initError.message };
  }

  const { error: presentError } = await presentPaymentSheet();
  if (presentError) {
    const cancelled = presentError.code === 'Canceled';
    return {
      ok: false,
      cancelled,
      message: presentError.message,
    };
  }

  return { ok: true };
}
