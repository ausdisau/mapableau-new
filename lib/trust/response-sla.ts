import type { ResponseSlaStatus, ProviderResponseSla } from "@/types/wedges";

export function computeResponseSlaStatus(
  averageResponseTimeHours: number | null,
  responseRate: number | null,
): ResponseSlaStatus {
  if (averageResponseTimeHours == null && responseRate == null) return "unknown";
  if (averageResponseTimeHours != null && averageResponseTimeHours <= 8) return "excellent";
  if (averageResponseTimeHours != null && averageResponseTimeHours <= 24) return "good";
  if (responseRate != null && responseRate >= 0.8 && averageResponseTimeHours != null && averageResponseTimeHours <= 48) {
    return "good";
  }
  if (averageResponseTimeHours != null && averageResponseTimeHours > 48) return "slow";
  if (responseRate != null && responseRate < 0.5) return "slow";
  return "unknown";
}

export function responseSlaLabel(status: ResponseSlaStatus): string {
  switch (status) {
    case "excellent":
      return "Usually responds within 8 hours";
    case "good":
      return "Usually responds within 1–2 days";
    case "slow":
      return "May take several days to respond";
    case "unknown":
      return "Response time not yet verified";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function formatResponseTimeHours(hours: number | null): string {
  if (hours == null) return "Unknown";
  if (hours < 1) return "Under 1 hour";
  if (hours < 24) return `About ${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? "About 1 day" : `About ${days} days`;
}

export function isStaleRequest(
  sla: ProviderResponseSla,
  contactedAt: string,
): boolean {
  if (!sla.enquiryExpiryDays) return false;
  const contacted = new Date(contactedAt);
  const expiryMs = sla.enquiryExpiryDays * 24 * 60 * 60 * 1000;
  return Date.now() - contacted.getTime() > expiryMs;
}
