import Link from "next/link";

const TAGS = [
  { slug: "easy_open", label: "Easy-open packaging" },
  { slug: "texture_modified", label: "Texture modified" },
  { slug: "large_print_label", label: "Large-print labels" },
];

export function AccessibilityFoodFilters({ active }: { active?: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium">Accessibility</h3>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Accessibility filters">
        {TAGS.map((t) => (
          <Link
            key={t.slug}
            href={`/foods/search?accessibilityTag=${t.slug}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              active === t.slug ? "bg-primary/10 text-primary ring-2 ring-primary" : ""
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
