import type { VoiceAdapterKind, VoiceTranscriptionResult } from "@/types/voice";

export type VoiceTranscribeInput = {
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
  sessionId: string;
  intendedDraftType?: string;
};

export interface VoiceAdapter {
  readonly kind: VoiceAdapterKind;
  getDisplayName(): string;
  isAvailable(): boolean;
  transcribe(input: VoiceTranscribeInput): Promise<VoiceTranscriptionResult>;
}

export class VoiceAdapterError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_CONFIGURED"
      | "NOT_AVAILABLE"
      | "TRANSCRIPTION_FAILED"
  ) {
    super(message);
    this.name = "VoiceAdapterError";
  }
}
