import { MAPABLE_GLOSSARY } from "@/lib/content/glossary";

/** Plain-language glossary for first-use expansion of abbreviations. */
export function Glossary({
  heading = "Plain-language glossary",
}: {
  heading?: string;
}) {
  return (
    <section aria-labelledby="glossary-heading" className="space-y-4">
      <h2 id="glossary-heading" className="text-lg font-black text-[#0C1833]">
        {heading}
      </h2>
      <p className="max-w-[80ch] text-base leading-[1.5] text-slate-600">
        Short meanings for words you may see on MapAble. Written for lower
        secondary reading level.
      </p>
      <dl className="space-y-4">
        {MAPABLE_GLOSSARY.map((entry) => (
          <div key={entry.term} className="max-w-[80ch]">
            <dt className="font-black text-[#004766]">
              <abbr title={entry.expansion}>{entry.term}</abbr>
              <span className="font-normal text-slate-600">
                {" "}
                — {entry.expansion}
              </span>
            </dt>
            <dd className="mt-1 text-base leading-[1.5] text-slate-700">
              {entry.plainLanguage}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Inline first-use expansion helper for abbreviations in prose. */
export function Abbr({
  term,
  children,
}: {
  term: string;
  children?: string;
}) {
  const entry = MAPABLE_GLOSSARY.find(
    (g) => g.term.toLowerCase() === term.toLowerCase(),
  );
  if (!entry) {
    return <abbr>{children ?? term}</abbr>;
  }
  return (
    <abbr title={`${entry.expansion}. ${entry.plainLanguage}`}>
      {children ?? entry.term}
    </abbr>
  );
}
