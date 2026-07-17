import type { AuraPocketCapabilityState } from "../pocket/types";

export type AuraLocalAudioInput = { localReference: string; durationSeconds?: number };
export type AuraLocalImageInput = { localReference: string };
export type AuraLocalRewriteInput = { text: string; style: "plain_language" };
export type AuraLocalSummaryInput = { text: string; maxSentences: number };
export type AuraLocalMultimodalInput = { text?: string; imageRef?: string };
export type AuraLocalTranscript = { text: string; localOnly: true };
export type AuraLocalTextResult = { text: string; localOnly: true };
export type AuraImageDescriptionCandidate = {
  description: string;
  provisional: true;
  notAMeasurement: true;
};
export type AuraLocalMultimodalResult = {
  text: string;
  candidates: AuraImageDescriptionCandidate[];
  localOnly: true;
};

export interface AuraOnDeviceAiAdapter {
  readonly adapterId: string;
  readonly platform: "android" | "ios" | "browser" | "simulator";
  detectCapabilities(): Promise<AuraPocketCapabilityState[]>;
  transcribeSpeech?(input: AuraLocalAudioInput): Promise<AuraLocalTranscript>;
  describeImage?(input: AuraLocalImageInput): Promise<AuraImageDescriptionCandidate>;
  rewriteText?(input: AuraLocalRewriteInput): Promise<AuraLocalTextResult>;
  summariseText?(input: AuraLocalSummaryInput): Promise<AuraLocalTextResult>;
  runMultimodalPrompt?(input: AuraLocalMultimodalInput): Promise<AuraLocalMultimodalResult>;
}
