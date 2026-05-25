import { createPlaceholderVoiceAdapter } from "@/lib/voice/adapters/placeholder-voice-adapter";
import { voiceConfig } from "@/lib/voice/config";

export const voskAdapter = createPlaceholderVoiceAdapter(
  "vosk",
  "Vosk (offline STT)",
  voiceConfig.voskApiUrl
);
