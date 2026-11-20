/** First-use expansions for common MapAble / NDIS abbreviations (WCAG 3.1.3–3.1.4). */
export type GlossaryEntry = {
  term: string;
  expansion: string;
  plainLanguage: string;
};

export const MAPABLE_GLOSSARY: GlossaryEntry[] = [
  {
    term: "NDIS",
    expansion: "National Disability Insurance Scheme",
    plainLanguage:
      "Australia’s national program that funds disability supports for eligible people.",
  },
  {
    term: "WCAG",
    expansion: "Web Content Accessibility Guidelines",
    plainLanguage:
      "International rules that explain how to make websites usable for people with disability.",
  },
  {
    term: "ATAG",
    expansion: "Authoring Tool Accessibility Guidelines",
    plainLanguage:
      "Rules for tools that create content, so authors can make accessible pages and maps.",
  },
  {
    term: "AAA",
    expansion: "WCAG Level AAA",
    plainLanguage:
      "The highest WCAG conformance level. Not every page or third-party widget can meet it.",
  },
  {
    term: "BECS",
    expansion: "Bulk Electronic Clearing System",
    plainLanguage: "The Australian bank system used for direct debit payments.",
  },
];

export function glossaryByTerm(): Record<string, GlossaryEntry> {
  return Object.fromEntries(
    MAPABLE_GLOSSARY.map((entry) => [entry.term.toLowerCase(), entry]),
  );
}
