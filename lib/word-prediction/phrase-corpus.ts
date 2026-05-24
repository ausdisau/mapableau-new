import type { PredictionContext } from "@/types/word-prediction";

const COMMON_WORDS = [
  "I",
  "need",
  "help",
  "with",
  "please",
  "thank",
  "you",
  "today",
  "tomorrow",
  "morning",
  "afternoon",
  "appointment",
  "support",
  "worker",
  "transport",
  "wheelchair",
  "accessible",
];

const PHRASES_BY_CONTEXT: Record<PredictionContext, string[]> = {
  copilot: [
    "I need a support worker",
    "I need transport to an appointment",
    "Can you help me find a provider",
    "I need help with NDIS funding",
    "Book care for next Tuesday morning",
    "I need wheelchair accessible transport",
    "Find a provider near me",
    "What support is available for me",
  ],
  message: [
    "Thank you for your message",
    "I would like to reschedule",
    "Please call me back",
    "I need more information",
    "That time works for me",
    "I have a question about my booking",
    "Can we change the appointment",
  ],
  booking: [
    "I need pickup at my home",
    "Please allow extra boarding time",
    "I use a manual wheelchair",
    "Assistance animal will be with me",
    "Driver assistance to the door please",
    "Appointment is at the clinic",
    "Return trip required",
  ],
  general: [
    "I need support at home",
    "Personal care assistance",
    "Community access support",
    "Plan managed funding",
    "Self managed NDIS",
    "Please use plain language",
  ],
};

export function getCorpusForContext(context: PredictionContext): string[] {
  const contextPhrases =
    context === "general" ? [] : PHRASES_BY_CONTEXT[context];
  const phrases = [...PHRASES_BY_CONTEXT.general, ...contextPhrases];
  return [...new Set([...phrases, ...COMMON_WORDS])];
}
