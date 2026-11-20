import Link from "next/link";

import {
  categoriesForDomain,
  directoryRoute,
  type DirectoryDomain,
} from "@/lib/search/domain-directory-taxonomy";

/** Public discoverability of the same category IDs used in MapAble Search. */
export function DirectoryCategoryLinks({ domain }: { domain: DirectoryDomain }) {
  const categories = categoriesForDomain(domain).filter((item) => item.id !== "all");
  const directoryHref = directoryRoute(domain);
  return (
    <section aria-labelledby={"category-links-" + domain} className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <div>
        <h2 id={"category-links-" + domain} className="font-heading text-2xl font-bold">
          Explore {domain === "jobs" ? "employment opportunities and support" : "rehabilitation and therapy"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Source-labelled directory preview. Service category does not establish
          verified credentials, appointments, job availability, accessible premises or funding.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={directoryHref + "?category=" + encodeURIComponent(category.id)}
              className="block min-h-16 rounded-xl border border-border bg-card p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="block font-semibold underline underline-offset-4">{category.label}</span>
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">{category.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={"/search?vertical=" + domain}
        className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-semibold underline underline-offset-4"
      >
        Search across MapAble with this area selected
      </Link>
    </section>
  );
}
