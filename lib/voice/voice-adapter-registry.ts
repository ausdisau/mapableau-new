import { fasterWhisperAdapter } from "@/lib/voice/adapters/faster-whisper-adapter";
import { mockVoiceAdapter } from "@/lib/voice/adapters/mock-voice-adapter";
import { speachesAdapter } from "@/lib/voice/adapters/speaches-adapter";
import { voskAdapter } from "@/lib/voice/adapters/vosk-adapter";
import { whisperCppAdapter } from "@/lib/voice/adapters/whisper-cpp-adapter";
import type { VoiceAdapter } from "@/lib/voice/voice-adapter";
import { voiceConfig } from "@/lib/voice/config";
import type { VoiceAdapterKind } from "@/types/voice";

const adapters: VoiceAdapter[] = [
  mockVoiceAdapter,
  speachesAdapter,
  fasterWhisperAdapter,
  whisperCppAdapter,
  voskAdapter,
];

export function resolveVoiceAdapter(kind?: VoiceAdapterKind): VoiceAdapter {
  const mode = kind ?? voiceConfig.adapterMode;
  const found = adapters.find((a) => a.kind === mode);
  if (found?.isAvailable()) return found;
  if (mockVoiceAdapter.isAvailable()) return mockVoiceAdapter;
  return found ?? mockVoiceAdapter;
}

export function listVoiceAdapters(): VoiceAdapter[] {
  return adapters;
}
