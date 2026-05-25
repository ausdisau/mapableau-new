import { z } from "zod";

export const voiceDraftTypeSchema = z.enum([
  "care_request",
  "transport_trip",
  "care_transport_bundle",
  "provider_message",
  "service_log",
  "incident_draft",
  "search_query",
]);

export const createVoiceSessionSchema = z.object({
  intendedDraftType: voiceDraftTypeSchema,
  organisationId: z.string().cuid().optional().nullable(),
});

export const patchTranscriptSchema = z.object({
  editedTranscript: z.string().min(1).max(20000),
});
