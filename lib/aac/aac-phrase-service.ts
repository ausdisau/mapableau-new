import { prisma } from "@/lib/prisma";
import type { AacPhrase } from "@/types/messages";

export const DEFAULT_AAC_PHRASES: Omit<AacPhrase, "id" | "profileId">[] = [
  { label: "Hello", phrase: "Hello, thank you for speaking with me.", category: "greetings", sortOrder: 0 },
  { label: "Yes", phrase: "Yes, that works for me.", category: "yes_no", sortOrder: 1 },
  { label: "No", phrase: "No, I need something different.", category: "yes_no", sortOrder: 2 },
  { label: "Need help", phrase: "I need help, please.", category: "help", sortOrder: 3 },
  { label: "Need a break", phrase: "I need a short break.", category: "break", sortOrder: 4 },
  { label: "Not comfortable", phrase: "I am not comfortable right now.", category: "safety", sortOrder: 5 },
  { label: "Thank you", phrase: "Thank you for your support.", category: "greetings", sortOrder: 6 },
  { label: "Repeat please", phrase: "Could you please repeat that?", category: "help", sortOrder: 7 },
];

function mapPhrase(row: {
  id: string;
  profileId: string;
  label: string;
  phrase: string;
  category: string;
  sortOrder: number;
}): AacPhrase {
  return {
    id: row.id,
    profileId: row.profileId,
    label: row.label,
    phrase: row.phrase,
    category: row.category,
    sortOrder: row.sortOrder,
  };
}

export async function listPhrasesForProfile(profileId: string): Promise<AacPhrase[]> {
  const custom = await prisma.aacPhrase.findMany({
    where: { profileId },
    orderBy: { sortOrder: "asc" },
  });
  if (custom.length) {
    return custom.map(mapPhrase);
  }
  return DEFAULT_AAC_PHRASES.map((p, i) => ({
    id: `preset-${i}`,
    profileId,
    ...p,
  }));
}

export async function replacePhrasesForProfile(
  profileId: string,
  phrases: { label: string; phrase: string; category?: string; sortOrder?: number }[]
) {
  await prisma.$transaction([
    prisma.aacPhrase.deleteMany({ where: { profileId } }),
    prisma.aacPhrase.createMany({
      data: phrases.map((p, i) => ({
        profileId,
        label: p.label,
        phrase: p.phrase,
        category: p.category ?? "custom",
        sortOrder: p.sortOrder ?? i,
      })),
    }),
  ]);
  return listPhrasesForProfile(profileId);
}

export async function resolvePhraseText(
  profileId: string,
  phraseId?: string,
  phraseText?: string
): Promise<string> {
  if (phraseText?.trim()) return phraseText.trim().slice(0, 500);
  if (!phraseId) throw new Error("PHRASE_REQUIRED");

  if (phraseId.startsWith("preset-")) {
    const idx = Number(phraseId.replace("preset-", ""));
    const preset = DEFAULT_AAC_PHRASES[idx];
    if (preset) return preset.phrase;
  }

  const row = await prisma.aacPhrase.findFirst({
    where: { id: phraseId, profileId },
  });
  if (!row) throw new Error("PHRASE_NOT_FOUND");
  return row.phrase;
}
