import Link from "next/link";

const TAGS = ["gluten_free", "dairy_free", "vegan", "halal", "low_sodium"];

export function DietaryTagFilters({ active }: { active?: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium">Dietary</h3>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Dietary filters">
        {TAGS.map((tag) => (
          <Link
            key={tag}
            href={`/foods/search?dietaryTag=${tag}`}
            className={`rounded-full border px-3 py-1 text-sm capitalize ${
              active === tag ? "bg-amber-100 text-amber-900 ring-2 ring-amber-600" : ""
            }`}
          >
            {tag.replace(/_/g, " ")}
          </Link>
        ))}
      </div>
    </div>
  );
}
