import type { AbnEntityStatus, AbnLookupResult } from "@/lib/abn-lookup/types";
import { normalizeAbnDigits } from "@/lib/abn-lookup/format-abn";

function textBetween(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  if (!m?.[1]) return null;
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim() || null;
}

function firstMatch(xml: string, tags: string[]): string | null {
  for (const tag of tags) {
    const v = textBetween(xml, tag);
    if (v) return v;
  }
  return null;
}

function mapEntityStatus(code: string | null): AbnEntityStatus {
  if (!code) return "Unknown";
  const u = code.toUpperCase();
  if (u === "ACTIVE") return "Active";
  if (u === "CANCELLED" || u === "CANCELED") return "Cancelled";
  return "Unknown";
}

/**
 * Parse ABR RPC XML response (SearchByABN / businessEntity202001 payload).
 */
export function parseAbrSearchByAbnXml(xml: string, abn: string): AbnLookupResult {
  const digits = normalizeAbnDigits(abn);
  const exceptionCode = firstMatch(xml, ["exceptionCode"]);
  const exceptionDescription = firstMatch(xml, [
    "exceptionDescription",
    "exceptionMessage",
  ]);

  if (exceptionCode || /exception/i.test(xml.slice(0, 500))) {
    return {
      mode: "http",
      abn: digits,
      entityName: null,
      entityStatus: "Unknown",
      entityType: null,
      gstRegistered: null,
      message: exceptionDescription ?? "ABR lookup exception",
      exceptionCode,
      exceptionDescription,
      rawAvailable: true,
    };
  }

  const entityStatusCode = firstMatch(xml, [
    "entityStatusCode",
    "entityStatus",
  ]);
  const entityName =
    firstMatch(xml, ["organisationName", "fullName", "nonIndividualName"]) ??
    firstMatch(xml, ["mainName", "businessName"]);

  const entityType = firstMatch(xml, ["entityTypeCode", "entityType", "entityDescription"]);
  const gstText = xml.match(/<GST[^>]*>[\s\S]*?<isActive>([^<]+)</i);
  const gstRegistered = gstText
    ? gstText[1]?.trim().toLowerCase() === "y" || gstText[1]?.trim().toLowerCase() === "true"
    : null;

  const abnFromXml = firstMatch(xml, ["identifierValue", "abn"]) ?? digits;

  return {
    mode: "http",
    abn: normalizeAbnDigits(abnFromXml) || digits,
    entityName,
    entityStatus: mapEntityStatus(entityStatusCode),
    entityType,
    gstRegistered,
    message: null,
    exceptionCode: null,
    exceptionDescription: null,
    rawAvailable: true,
  };
}
