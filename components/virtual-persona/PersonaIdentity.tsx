export function PersonaIdentity() {
  return (
    <aside
      className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      aria-labelledby="vp-persona-name"
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#005B7F] text-lg font-bold text-white"
        aria-hidden="true"
      >
        M
      </div>
      <div>
        <h2 id="vp-persona-name" className="text-lg font-bold text-[#0C1833]">
          MapAble Guide
        </h2>
        <p className="mt-1 text-sm text-slate-700">
          An AI-assisted helper for understanding information and preparing
          drafts. It is <strong>not a human</strong>, not an NDIA officer, and
          not a clinician. It may make mistakes. You decide what happens next.
        </p>
      </div>
    </aside>
  );
}
