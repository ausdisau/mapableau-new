import { getMapablePublicUrl } from "@/lib/mcp/config";

export type MapableDeepLinks = {
  askUrl: string;
  workerSearchUrl: string;
  assessmentUrl: string;
  shiftCreatorUrl: string;
  providerCareUrl: string;
};

export function buildDeepLinks(params?: {
  query?: string;
  participantId?: string;
  careBookingId?: string;
}): MapableDeepLinks {
  const base = getMapablePublicUrl();
  const q = params?.query?.trim();
  const participantId = params?.participantId?.trim();
  const careBookingId = params?.careBookingId?.trim();

  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (participantId) search.set("participantId", participantId);
  const qs = search.toString();

  const shiftSearch = new URLSearchParams();
  if (careBookingId) shiftSearch.set("careBookingId", careBookingId);
  if (q) shiftSearch.set("q", q);
  const shiftQs = shiftSearch.toString();

  return {
    askUrl: `${base}/ask${qs ? `?${qs}` : ""}`,
    workerSearchUrl: `${base}/worker-search${qs ? `?${qs}` : ""}`,
    assessmentUrl: participantId
      ? `${base}/participant-needs-assess?participantId=${encodeURIComponent(participantId)}${q ? `&q=${encodeURIComponent(q)}` : ""}`
      : `${base}/participant-needs-assess`,
    shiftCreatorUrl: `${base}/provider/care/shift-creator${shiftQs ? `?${shiftQs}` : ""}`,
    providerCareUrl: `${base}/provider/care`,
  };
}
