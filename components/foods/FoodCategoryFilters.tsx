import Link from "next/link";

const CATEGORIES = [
  { slug: "fresh", label: "Fresh produce" },
  { slug: "meals", label: "Prepared meals" },
  { slug: "pantry", label: "Pantry" },
  { slug: "household", label: "Household essentials" },
];

export function FoodCategoryFilters({ active }: { active?: string }) {
  return (
    <nav aria-label="Food categories" className="flex flex-wrap gap-2">
      <Link
        href="/foods/search"
        className={`rounded-full border px-3 py-1 text-sm ${!active ? "bg-primary/10 text-primary" : ""}`}
      >
        All
      </Link>
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/foods/search?category=${c.slug}`}
          className={`rounded-full border px-3 py-1 text-sm ${
            active === c.slug ? "bg-primary/10 text-primary" : ""
          }`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
