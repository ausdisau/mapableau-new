import { createPlaceholderVoiceAdapter } from "@/lib/voice/adapters/placeholder-voice-adapter";
import { voiceConfig } from "@/lib/voice/config";

export const fasterWhisperAdapter = createPlaceholderVoiceAdapter(
  "faster_whisper",
  "faster-whisper API",
  voiceConfig.fasterWhisperApiUrl
);
