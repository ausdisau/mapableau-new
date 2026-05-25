import { z } from "zod";

export const aacPhraseSchema = z.object({
  label: z.string().min(1).max(80),
  phrase: z.string().min(1).max(500),
  category: z.string().max(40).optional().default("custom"),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
});

export const updateAacPhrasesSchema = z.object({
  phrases: z.array(aacPhraseSchema).max(50),
});

export const aacSpeakSchema = z.object({
  phraseId: z.string().optional(),
  phrase: z.string().min(1).max(500).optional(),
  sendImmediately: z.boolean().optional().default(true),
});
