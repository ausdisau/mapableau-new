import { z } from "zod";

export const aacPhraseSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1).max(500),
    category: z.string().optional(),
  })
  .strict();

export type AacPhrase = z.infer<typeof aacPhraseSchema>;

export const DEFAULT_CARE_AAC_PHRASES: AacPhrase[] = [
  { id: "care-help", text: "I need help today.", category: "care" },
  { id: "care-water", text: "I would like a glass of water.", category: "care" },
  {
    id: "care-break",
    text: "Please give me a moment to finish.",
    category: "care",
  },
  {
    id: "care-support",
    text: "I need support this afternoon.",
    category: "care",
  },
  {
    id: "care-cancel",
    text: "Please cancel today's support visit.",
    category: "care",
  },
];

/** Confirmed AAC/text expressions do not require microphone or transcription consent. */
export function expressionRequiresTranscriptionConsent(
  source: "speech" | "text" | "aac",
): boolean {
  return source === "speech";
}
