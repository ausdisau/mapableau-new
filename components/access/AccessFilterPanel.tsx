"use client";

const CATEGORIES = [
  "cafe_restaurant",
  "shop",
  "park",
  "library",
  "transport_station",
  "public_toilet",
  "other",
] as const;

export function AccessFilterPanel({
  category,
  onCategoryChange,
}: {
  category: string;
  onCategoryChange: (c: string) => void;
}) {
  return (
    <fieldset className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
      <legend className="px-1 text-sm font-black text-foreground">
        Category
      </legend>
      <select
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-ring/30"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
