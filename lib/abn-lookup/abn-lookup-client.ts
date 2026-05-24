import { abrLookupConfig, isAbrLookupLiveEnabled } from "@/lib/abn-lookup/config";
import { normalizeAbnDigits } from "@/lib/abn-lookup/format-abn";
import { getMockAbnLookup } from "@/lib/abn-lookup/mock-fixtures";
import { parseAbrSearchByAbnXml } from "@/lib/abn-lookup/parse-response";
import type { AbnLookupResult } from "@/lib/abn-lookup/types";
import { validateAbnChecksum } from "@/lib/abn-lookup/validate-abn";

const ABR_ABN_URL =
  "https://abr.business.gov.au/abrxmlsearchRPC/ABRXMLSearch.asmx/ABRSearchByABN";

export type LookupAbnOptions = {
  includeHistoricalDetails?: boolean;
};

export class AbnLookupError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_ABN" | "NOT_CONFIGURED" | "HTTP_ERROR" | "PARSE_ERROR"
  ) {
    super(message);
    this.name = "AbnLookupError";
  }
}

function buildAbnUrl(abn: string, includeHistory: boolean, guid: string): string {
  const params = new URLSearchParams({
    searchString: abn,
    includeHistoricalDetails: includeHistory ? "Y" : "N",
    authenticationGuid: guid,
  });
  return `${ABR_ABN_URL}?${params.toString()}`;
}

async function fetchAbrXml(abn: string, includeHistory: boolean): Promise<string> {
  const guid = abrLookupConfig.guid;
  if (!guid) {
    throw new AbnLookupError("ABR_LOOKUP_GUID is not configured", "NOT_CONFIGURED");
  }

  const url = buildAbnUrl(abn, includeHistory, guid);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), abrLookupConfig.requestTimeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/xml" },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new AbnLookupError(`ABR HTTP ${res.status}`, "HTTP_ERROR");
    }
    return await res.text();
  } catch (e) {
    if (e instanceof AbnLookupError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new AbnLookupError("ABR request timed out", "HTTP_ERROR");
    }
    throw new AbnLookupError(
      e instanceof Error ? e.message : "ABR request failed",
      "HTTP_ERROR"
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Look up an ABN via ABR web services (HTTP GET RPC) or mock fixtures.
 * Mirrors official sample: HttpGetRpcSearch.BuildAbnQueryString.
 */
export async function lookupAbn(
  abn: string,
  options: LookupAbnOptions = {}
): Promise<AbnLookupResult> {
  const validated = validateAbnChecksum(abn);
  if (!validated.valid) {
    throw new AbnLookupError(validated.reason, "INVALID_ABN");
  }

  const digits = validated.digits;

  if (!isAbrLookupLiveEnabled()) {
    const mock = getMockAbnLookup(digits);
    if (mock) return mock;
    return {
      mode: "mock",
      abn: digits,
      entityName: `Mock Entity ${digits.slice(0, 2)}`,
      entityStatus: "Active",
      entityType: "PRV",
      gstRegistered: null,
      message: "Generic mock result (set ABR_LOOKUP_ADAPTER_MODE=http for live)",
      exceptionCode: null,
      exceptionDescription: null,
      rawAvailable: false,
    };
  }

  const xml = await fetchAbrXml(digits, options.includeHistoricalDetails ?? false);
  try {
    return parseAbrSearchByAbnXml(xml, digits);
  } catch {
    throw new AbnLookupError("Failed to parse ABR response", "PARSE_ERROR");
  }
}

export function formatAbnForDisplay(abn: string): string {
  const d = normalizeAbnDigits(abn);
  if (d.length !== 11) return abn;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 11)}`;
}
