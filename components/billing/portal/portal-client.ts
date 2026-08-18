export type PortalFlowRequest = {
  flow?: "payment_method_update" | "subscription_cancel" | "subscription_update";
  subscriptionId?: string;
};

export type CheckoutStartResult = {
  checkoutUrl?: string;
  instruction?: string;
  error?: string;
};

export async function startInvoiceCheckout(
  invoiceId: string
): Promise<CheckoutStartResult> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId }),
  });
  const data = (await res.json()) as {
    checkoutUrl?: string;
    checkout?: { instruction?: string };
    error?: string;
  };
  return {
    checkoutUrl: data.checkoutUrl,
    instruction: data.checkout?.instruction,
    error: data.error,
  };
}

export async function openCustomerPortal(
  request: PortalFlowRequest = {}
): Promise<{ portalUrl?: string; error?: string }> {
  const res = await fetch("/api/billing/customer-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = (await res.json()) as { portalUrl?: string; error?: string };
  return { portalUrl: data.portalUrl, error: data.error };
}

export async function exportBillingInvoice(
  invoiceId: string,
  format: "csv" | "plan_manager"
): Promise<{ content?: string; payload?: unknown; error?: string }> {
  const res = await fetch("/api/billing/invoices/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId, format }),
  });
  return (await res.json()) as {
    content?: string;
    payload?: unknown;
    error?: string;
  };
}

export function downloadCsvContent(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
