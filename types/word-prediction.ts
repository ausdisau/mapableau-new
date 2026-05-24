import { z } from "zod";

export const PREDICTION_CONTEXTS = [
  "copilot",
  "message",
  "booking",
  "general",
] as const;

export type PredictionContext = (typeof PREDICTION_CONTEXTS)[number];

export type PredictionSuggestion = {
  id: string;
  text: string;
  kind: "word" | "phrase";
  score: number;
};

export const predictionQuerySchema = z.object({
  q: z.string().max(5000),
  caret: z.coerce.number().int().min(0).optional(),
  context: z.enum(PREDICTION_CONTEXTS).default("general"),
  limit: z.coerce.number().int().min(1).max(12).default(8),
});

export type DigitalInputPreferences = {
  wordPredictionEnabled?: boolean;
  voiceControlPreferred?: boolean;
  customPhrases?: string[];
};
