import {
  isNlSearchConfigured,
  nlSearchConfig,
} from "@/lib/search/nl-search-config";
import {
  geminiNlFiltersSchema,
  type GeminiNlFilters,
} from "@/lib/search/nl-search-validation";
import type { NaturalLanguageSearchFilters } from "@/types/search";

const SYSTEM_PROMPT = `You parse natural-language search queries for MapAble, an Australian NDIS disability support provider directory.

Extract structured search filters from the user's query. Return JSON only with these fields:
- q: main search keywords (support type, general terms) — omit location, access needs, and provider names already captured in other fields
- location: Australian suburb, city, or postcode if mentioned
- access: accessibility or access needs (e.g. wheelchair access, Auslan, low sensory, hoist)
- service: specific service type if distinct from q (e.g. physiotherapy, occupational therapy)
- provider: specific provider or organisation name if mentioned

Use empty strings for fields not mentioned. Prefer Australian English and NDIS terminology.
Examples:
- "Support worker near St Ives" → {"q":"support worker","location":"St Ives","access":"","service":"","provider":""}
- "Wheelchair accessible transport tomorrow" → {"q":"transport","location":"","access":"wheelchair access","service":"transport","provider":""}
- "OT assessment with NDIS registration in Parramatta" → {"q":"OT assessment","location":"Parramatta","access":"","service":"occupational therapy","provider":""}`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    q: { type: "string", description: "Main search keywords" },
    location: { type: "string", description: "Suburb or postcode" },
    access: { type: "string", description: "Accessibility needs" },
    service: { type: "string", description: "Service type" },
    provider: { type: "string", description: "Provider name" },
  },
  required: ["q", "location", "access", "service", "provider"],
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

function normalizeFilters(raw: GeminiNlFilters): NaturalLanguageSearchFilters {
  return {
    q: raw.q.trim(),
    location: raw.location.trim(),
    access: raw.access.trim(),
    service: raw.service.trim(),
    provider: raw.provider.trim(),
  };
}

function passthroughFilters(query: string): NaturalLanguageSearchFilters {
  return {
    q: query.trim(),
    location: "",
    access: "",
    service: "",
    provider: "",
  };
}

export function looksLikeNaturalLanguage(query: string): boolean {
  const q = query.trim();
  if (q.length < 5) return false;
  const wordCount = q.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 3) return true;
  return /\b(near|with|in|for|accessible|transport|worker|support|ndis|therapy|physio)\b/i.test(
    q,
  );
}

export async function parseNaturalLanguageQuery(
  query: string,
): Promise<{ filters: NaturalLanguageSearchFilters; parsed: boolean }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { filters: passthroughFilters(""), parsed: false };
  }

  if (!isNlSearchConfigured()) {
    return { filters: passthroughFilters(trimmed), parsed: false };
  }

  const url = `${nlSearchConfig.geminiBaseUrl}/models/${nlSearchConfig.geminiModel}:generateContent`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": nlSearchConfig.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${SYSTEM_PROMPT}\n\nQuery: ${trimmed}` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Gemini API error ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      );
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned no content");
    }

    const json = JSON.parse(text) as unknown;
    const parsed = geminiNlFiltersSchema.safeParse(json);

    if (!parsed.success) {
      throw new Error("Gemini response did not match expected schema");
    }

    const filters = normalizeFilters(parsed.data);

    if (!filters.q && !filters.location && !filters.service) {
      filters.q = trimmed;
    }

    return { filters, parsed: true };
  } finally {
    clearTimeout(timeout);
  }
}

export async function parseNaturalLanguageQuerySafe(
  query: string,
): Promise<{ filters: NaturalLanguageSearchFilters; parsed: boolean }> {
  try {
    return await parseNaturalLanguageQuery(query);
  } catch {
    return { filters: passthroughFilters(query.trim()), parsed: false };
  }
}
