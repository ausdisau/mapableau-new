import type { VoiceAdapterKind } from "@/types/voice";

export const voiceConfig = {
  adapterMode: (process.env.VOICE_ADAPTER_MODE ?? "mock") as VoiceAdapterKind,
  deleteAudioAfterTranscribe:
    process.env.VOICE_DELETE_AUDIO_AFTER_TRANSCRIBE !== "false",
  maxAudioBytes: Number(process.env.VOICE_MAX_AUDIO_BYTES ?? String(10 * 1024 * 1024)),
  speachesApiUrl: process.env.VOICE_SPEACHES_API_URL ?? "",
  fasterWhisperApiUrl: process.env.VOICE_FASTER_WHISPER_API_URL ?? "",
  whisperCppApiUrl: process.env.VOICE_WHISPER_CPP_API_URL ?? "",
  voskApiUrl: process.env.VOICE_VOSK_API_URL ?? "",
  allowThirdPartyByDefault: process.env.VOICE_ALLOW_THIRD_PARTY === "true",
};

export function isThirdPartyAdapter(kind: VoiceAdapterKind): boolean {
  return kind !== "mock" && kind !== "whisper_cpp";
}

export function thirdPartyAllowedForUser(consentThirdParty: boolean): boolean {
  if (!isThirdPartyAdapter(voiceConfig.adapterMode)) return true;
  return voiceConfig.allowThirdPartyByDefault || consentThirdParty;
}
