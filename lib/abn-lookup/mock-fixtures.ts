import type { AbnLookupResult } from "@/lib/abn-lookup/types";

/** Deterministic mock ABNs for development and tests. */
export const MOCK_ABN_ACTIVE = "53004085616";
export const MOCK_ABN_CANCELLED = "99000000032";
export const MOCK_ABN_NAME_MISMATCH = "51824753556";

export function getMockAbnLookup(abn: string): AbnLookupResult | null {
  const digits = abn.replace(/\D/g, "");

  if (digits === MOCK_ABN_ACTIVE) {
    return {
      mode: "mock",
      abn: digits,
      entityName: "MapAble Demo Services Pty Ltd",
      entityStatus: "Active",
      entityType: "PRV",
      gstRegistered: true,
      message: null,
      exceptionCode: null,
      exceptionDescription: null,
      rawAvailable: false,
    };
  }

  if (digits === MOCK_ABN_CANCELLED) {
    return {
      mode: "mock",
      abn: digits,
      entityName: "Cancelled Entity Example",
      entityStatus: "Cancelled",
      entityType: "PRV",
      gstRegistered: false,
      message: "Entity is not active",
      exceptionCode: null,
      exceptionDescription: null,
      rawAvailable: false,
    };
  }

  if (digits === MOCK_ABN_NAME_MISMATCH) {
    return {
      mode: "mock",
      abn: digits,
      entityName: "Unrelated Holdings International",
      entityStatus: "Active",
      entityType: "PRV",
      gstRegistered: true,
      message: null,
      exceptionCode: null,
      exceptionDescription: null,
      rawAvailable: false,
    };
  }

  return null;
}
