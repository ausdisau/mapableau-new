import type { VoiceDraftType } from "@/types/voice";

/** Build structured draft payloads from confirmed transcript text — never auto-submits. */
export function buildDraftPayloadFromTranscript(
  draftType: VoiceDraftType,
  transcriptText: string
): Record<string, unknown> {
  const text = transcriptText.trim();

  switch (draftType) {
    case "care_request":
      return {
        title: text.slice(0, 80) || "Voice draft care request",
        description: text,
        requestType: "personal_care",
        source: "voice",
        requiresUserSubmit: true,
      };
    case "transport_trip":
      return {
        pickupAddress: extractAfter(text, /from\s+/i) ?? "",
        dropoffAddress: extractAfter(text, /to\s+/i) ?? "",
        notes: text,
        source: "voice",
        requiresUserSubmit: true,
      };
    case "care_transport_bundle":
      return {
        careDescription: text,
        linkedTransportRequired: /transport/i.test(text),
        source: "voice",
        requiresUserSubmit: true,
      };
    case "provider_message":
      return {
        body: text,
        subject: "Message from participant",
        source: "voice",
        requiresUserSubmit: true,
      };
    case "service_log":
      return {
        summary: text,
        source: "voice",
        requiresUserSubmit: true,
      };
    case "incident_draft":
      return {
        summary: text,
        category: "other",
        source: "voice",
        requiresUserSubmit: true,
      };
    case "search_query":
      return {
        query: text,
        source: "voice",
        requiresUserSubmit: true,
      };
    default:
      return { text, source: "voice", requiresUserSubmit: true };
  }
}

function extractAfter(text: string, pattern: RegExp): string | null {
  const m = text.match(pattern);
  if (!m || m.index === undefined) return null;
  return text.slice(m.index + m[0].length).trim().slice(0, 200) || null;
}
