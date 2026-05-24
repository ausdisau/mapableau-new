import type { VoiceAdapter, VoiceTranscribeInput } from "@/lib/voice/voice-adapter";
import { VoiceAdapterError } from "@/lib/voice/voice-adapter";
import type { VoiceAdapterKind, VoiceTranscriptionResult } from "@/types/voice";

export function createPlaceholderVoiceAdapter(
  kind: VoiceAdapterKind,
  displayName: string,
  apiUrlEnv: string
): VoiceAdapter {
  return {
    kind,
    getDisplayName: () => displayName,
    isAvailable: () => Boolean(apiUrlEnv),
    async transcribe(_input: VoiceTranscribeInput): Promise<VoiceTranscriptionResult> {
      if (!apiUrlEnv) {
        throw new VoiceAdapterError(
          `${displayName} is not configured. Set the API URL or use VOICE_ADAPTER_MODE=mock.`,
          "NOT_CONFIGURED"
        );
      }
      throw new VoiceAdapterError(
        `${displayName} HTTP integration is not enabled in this build. Use mock adapter locally.`,
        "NOT_AVAILABLE"
      );
    },
  };
}
