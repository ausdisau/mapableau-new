import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const bookingWizardSource = readFileSync(
  join(process.cwd(), "components/bookings/BookingWizard.tsx"),
  "utf8",
);
const providerPanelSource = readFileSync(
  join(process.cwd(), "components/bookings/ProviderBookingResponsePanel.tsx"),
  "utf8",
);
const invoicesClientSource = readFileSync(
  join(process.cwd(), "components/billing/BillingInvoicesClient.tsx"),
  "utf8",
);
const invoiceDetailSource = readFileSync(
  join(process.cwd(), "components/billing/BillingInvoiceDetailClient.tsx"),
  "utf8",
);
const fundingFormSource = readFileSync(
  join(process.cwd(), "app/dashboard/billing/funding/new/page.tsx"),
  "utf8",
);
const buttonSource = readFileSync(
  join(process.cwd(), "components/ui/button.tsx"),
  "utf8",
);

describe("Booking UI accessibility patterns", () => {
  it("BookingWizard exposes step semantics and validates datetime before advancing", () => {
    expect(bookingWizardSource).toContain('aria-current={i === step ? "step" : undefined}');
    expect(bookingWizardSource).toContain('aria-live="polite"');
    expect(bookingWizardSource).toContain("validateStep");
    expect(bookingWizardSource).toContain("Start date and time is required.");
    expect(bookingWizardSource).toContain("BOOKING_TYPE_LABELS");
    expect(bookingWizardSource).not.toMatch(/<dd>\{bookingType\}<\/dd>/);
  });

  it("BookingWizard uses StatusMessage for submit errors", () => {
    expect(bookingWizardSource).toContain("StatusMessage");
    expect(bookingWizardSource).toContain('variant="error"');
    expect(bookingWizardSource).toContain("fetchJson");
  });

  it("ProviderBookingResponsePanel confirms decline and reports fetch failures", () => {
    expect(providerPanelSource).not.toContain("window.prompt");
    expect(providerPanelSource).toContain("AccessibleConfirmDialog");
    expect(providerPanelSource).toContain("fetchJson");
    expect(providerPanelSource).toContain("acceptLoading");
    expect(providerPanelSource).toContain("declineLoading");
    expect(providerPanelSource).toContain("StatusMessage");
  });
});

describe("Billing UI accessibility patterns", () => {
  it("BillingInvoicesClient uses per-invoice busy state and fetchJson", () => {
    expect(invoicesClientSource).toContain("busyInvoiceId");
    expect(invoicesClientSource).toContain("fetchJson");
    expect(invoicesClientSource).toContain("history.replaceState");
    expect(invoicesClientSource).not.toMatch(/busy=\{busy\}/);
  });

  it("BillingInvoiceDetailClient replaces prompt dispute with accessible dialog", () => {
    expect(invoiceDetailSource).not.toContain("window.prompt");
    expect(invoiceDetailSource).toContain("AccessibleConfirmDialog");
    expect(invoiceDetailSource).toContain("inputMinLength={10}");
    expect(invoiceDetailSource).toContain("StatusMessage");
  });

  it("Funding form uses AccessibleFormField with hints and validation", () => {
    expect(fundingFormSource).toContain("AccessibleFormField");
    expect(fundingFormSource).toContain("fieldErrors");
    expect(fundingFormSource).toContain("fetchJson");
  });
});

describe("Shared UI accessibility patterns", () => {
  it("Button loading state exposes aria-busy and screen reader text", () => {
    expect(buttonSource).toContain('aria-busy={loading || undefined}');
    expect(buttonSource).toContain('className="sr-only"');
    expect(buttonSource).toContain("Loading");
  });
});
