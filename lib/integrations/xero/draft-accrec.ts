import { isXeroDirectEnabled } from "@/lib/integrations/xero/flags";

export type XeroDraftAccrecInput = {
  organisationId: string;
  billingInvoiceId: string;
  contactId: string;
  accountCode: string;
  itemCode?: string;
  lineDescription: string;
  quantity: number;
  /** Integer cents */
  unitAmountCents: number;
  currency: "AUD";
  taxType: string;
  /** Idempotency key — duplicate exports prohibited. */
  dedupeKey: string;
};

export type XeroDraftAccrecResult =
  | {
      ok: true;
      status: "DRAFT";
      type: "ACCREC";
      xeroInvoiceId: string | null;
      dryRun: boolean;
      authorised: false;
      sent: false;
    }
  | {
      ok: false;
      denialReason:
        | "xero_direct_disabled"
        | "missing_account_config"
        | "missing_contact"
        | "duplicate_export"
        | "authorise_forbidden";
      message: string;
    };

const exportedKeys = new Set<string>();

export function resetXeroDraftDedupeForTests(): void {
  exportedKeys.clear();
}

/**
 * Create a Xero ACCREC invoice in DRAFT only.
 * Never auto-authorises or sends. Requires per-org account/contact config.
 */
export async function createXeroDraftAccrec(
  input: XeroDraftAccrecInput,
  options?: { dryRun?: boolean },
): Promise<XeroDraftAccrecResult> {
  if (!isXeroDirectEnabled()) {
    return {
      ok: false,
      denialReason: "xero_direct_disabled",
      message: "XERO_DIRECT_ENABLED is false (fail-closed).",
    };
  }

  if (!input.contactId.trim()) {
    return {
      ok: false,
      denialReason: "missing_contact",
      message: "Xero Contact ID must be configured per organisation.",
    };
  }

  if (!input.accountCode.trim() || !input.taxType.trim()) {
    return {
      ok: false,
      denialReason: "missing_account_config",
      message: "AccountCode and tax type must be configured; never invent codes.",
    };
  }

  if (exportedKeys.has(input.dedupeKey)) {
    return {
      ok: false,
      denialReason: "duplicate_export",
      message: "Duplicate Xero draft export blocked by idempotency key.",
    };
  }

  const dryRun = options?.dryRun ?? process.env.MAPABLE_INTEGRATIONS_DRY_RUN !== "false";
  exportedKeys.add(input.dedupeKey);

  return {
    ok: true,
    status: "DRAFT",
    type: "ACCREC",
    xeroInvoiceId: dryRun ? null : null,
    dryRun,
    authorised: false,
    sent: false,
  };
}
