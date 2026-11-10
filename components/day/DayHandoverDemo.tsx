import { makeSyntheticHandoverPreview } from "@/lib/day/synthetic-fixtures";

/** Explicit synthetic worker view — no real plans. */
export function DayHandoverDemo() {
  const preview = makeSyntheticHandoverPreview();

  return (
    <section
      aria-labelledby="day-handover-heading"
      className="space-y-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 p-5"
      data-testid="day-handover-demo"
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
          {preview.label}
        </p>
        <h2
          id="day-handover-heading"
          className="font-heading text-xl font-bold text-[#0C1833]"
        >
          Shift handover preview
        </h2>
        <p className="mt-1 text-sm text-slate-700">{preview.disclosure}</p>
      </div>

      <ul className="space-y-2">
        {preview.permissions.map((permission) => (
          <li
            key={permission.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <span className="font-semibold text-[#0C1833]">{permission.label}</span>
            <span
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-extrabold text-slate-800"
              aria-label={
                permission.granted
                  ? `${permission.label}: preview granted`
                  : `${permission.label}: not granted`
              }
            >
              <span aria-hidden="true">{permission.granted ? "✓" : "✕"}</span>
              {permission.granted ? "Preview only" : "Not granted"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
