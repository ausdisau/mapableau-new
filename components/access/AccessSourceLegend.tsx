export function AccessSourceLegend() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4"
      aria-labelledby="access-source-legend-heading"
    >
      <h2
        id="access-source-legend-heading"
        className="text-sm font-black text-[#0C1833]"
      >
        Data sources and confidence
      </h2>
      <ul className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
        <li className="rounded-xl border border-[#005B7F]/25 bg-[#F6FBFC] p-3">
          <span className="block font-black text-[#005B7F]">Government boundary</span>
          <span className="mt-1 block">
            ABS ASGS Edition 4 (2026) GCCSA. Source and edition stay attached to
            the boundary layer.
          </span>
        </li>
        <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="block font-black text-[#0C1833]">OpenStreetMap</span>
          <span className="mt-1 block">
            Basemap context. MapAble place accessibility evidence remains separate
            from the basemap.
          </span>
        </li>
        <li className="rounded-xl border border-slate-200 bg-white p-3">
          <span className="block font-black text-[#0C1833]">Community observations</span>
          <span className="mt-1 block">
            Clearly labelled as reported evidence. Community reports do not become
            verified merely by being published.
          </span>
        </li>
      </ul>
    </section>
  );
}
