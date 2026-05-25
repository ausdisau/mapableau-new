import type { VoiceAdapter, VoiceTranscribeInput } from "@/lib/voice/voice-adapter";
import type { VoiceDraftType, VoiceTranscriptionResult } from "@/types/voice";

const MOCK_BY_DRAFT: Partial<Record<VoiceDraftType, string>> = {
  care_request:
    "I need personal care support tomorrow morning at home in Parramatta.",
  transport_trip:
    "I need a wheelchair accessible trip from 12 Main Street to the medical centre at 9 am.",
  care_transport_bundle:
    "I need community access with transport to therapy on Friday afternoon.",
  provider_message:
    "Please confirm my booking time for next Tuesday.",
  service_log:
    "Completed two hour community access. Participant was engaged and no issues.",
  incident_draft:
    "I want to report a minor concern about late arrival yesterday.",
  search_query: "Find support workers near Newcastle with personal care experience.",
};

export class MockVoiceAdapter implements VoiceAdapter {
  readonly kind = "mock" as const;

  getDisplayName(): string {
    return "MapAble mock (local development)";
  }

  isAvailable(): boolean {
    return true;
  }

  async transcribe(input: VoiceTranscribeInput): Promise<VoiceTranscriptionResult> {
    const draftType = input.intendedDraftType as VoiceDraftType | undefined;
    const text =
      (draftType && MOCK_BY_DRAFT[draftType]) ??
      "This is a mock transcript for local development. Please edit before confirming.";

    return {
      adapter: "mock",
      text,
      confidence: 0.92,
      language: input.language ?? "en-AU",
      metadata: { mock: true, audioBytes: input.audioBuffer.length },
    };
  }
}

export const mockVoiceAdapter = new MockVoiceAdapter();
