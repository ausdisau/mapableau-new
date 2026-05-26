"use client";

export function AccessSearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="flex flex-col gap-2 rounded-[1.4rem] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      role="search"
    >
      <label htmlFor="access-search" className="sr-only">
        Search places
      </label>
      <input
        id="access-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, suburb, or address"
        className="min-h-12 flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-semibold outline-none placeholder:text-slate-500 focus:border-primary/60 focus:ring-4 focus:ring-ring/30"
      />
      <button
        type="submit"
        className="min-h-12 rounded-xl bg-primary px-6 font-black text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-ring/40"
      >
        Search
      </button>
    </form>
  );
}
