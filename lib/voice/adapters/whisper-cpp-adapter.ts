import { createPlaceholderVoiceAdapter } from "@/lib/voice/adapters/placeholder-voice-adapter";
import { voiceConfig } from "@/lib/voice/config";

/** Future offline mobile / edge whisper.cpp endpoint. */
export const whisperCppAdapter = createPlaceholderVoiceAdapter(
  "whisper_cpp",
  "whisper.cpp (local/offline)",
  voiceConfig.whisperCppApiUrl
);
