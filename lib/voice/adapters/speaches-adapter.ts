import { createPlaceholderVoiceAdapter } from "@/lib/voice/adapters/placeholder-voice-adapter";
import { voiceConfig } from "@/lib/voice/config";

/** Open-source Speaches-compatible server (self-hosted). */
export const speachesAdapter = createPlaceholderVoiceAdapter(
  "speaches",
  "Speaches (open-source STT server)",
  voiceConfig.speachesApiUrl
);
