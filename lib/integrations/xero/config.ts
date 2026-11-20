import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";

export function getXeroDirectConfig() {
  return {
    enabled: integrationsFeatureFlags.xeroDirectEnabled(),
    clientId: process.env.XERO_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.XERO_CLIENT_SECRET?.trim() ?? "",
    redirectUri:
      process.env.XERO_REDIRECT_URI?.trim() ||
      process.env.XERO_OAUTH_REDIRECT_URI?.trim() ||
      "",
    webhookKey: process.env.XERO_WEBHOOK_KEY?.trim() ?? "",
    identityUrl: "https://login.xero.com/identity/connect/authorize",
    tokenUrl: "https://identity.xero.com/connect/token",
    apiBase: "https://api.xero.com/api.xro/2.0",
    connectionsUrl: "https://api.xero.com/connections",
  };
}

export function assertXeroDirectConfigured(): void {
  const cfg = getXeroDirectConfig();
  if (!cfg.enabled) throw new Error("XERO_DIRECT_ENABLED is false");
  if (!cfg.clientId || !cfg.clientSecret || !cfg.redirectUri) {
    throw new Error(
      "Xero direct requires XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI",
    );
  }
}

/** Per-org accounting codes — never invent chart-of-accounts values. */
export type XeroOrgAccountingConfig = {
  accountCode: string;
  itemCode?: string;
  taxType: string;
  currency: string;
  contactId?: string;
};

export function readOrgXeroAccountingConfig(
  configJson: unknown,
): XeroOrgAccountingConfig | null {
  if (!configJson || typeof configJson !== "object") return null;
  const c = configJson as Record<string, unknown>;
  const accountCode = typeof c.accountCode === "string" ? c.accountCode : "";
  const taxType = typeof c.taxType === "string" ? c.taxType : "";
  const currency =
    typeof c.currency === "string" && c.currency ? c.currency : "AUD";
  if (!accountCode || !taxType) return null;
  return {
    accountCode,
    itemCode: typeof c.itemCode === "string" ? c.itemCode : undefined,
    taxType,
    currency,
    contactId: typeof c.contactId === "string" ? c.contactId : undefined,
  };
}
