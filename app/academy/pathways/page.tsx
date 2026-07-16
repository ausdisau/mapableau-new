import Link from "next/link";

import { listPublicPathways } from "@/lib/academy/catalogue/catalogue-service";

export default async function AcademyPathwaysPage() {
  const pathways = await listPublicPathways();

  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-teal-950">
          Learning pathways
        </h1>
        <p className="mt-2 text-slate-700">
          Academy schools as role-based pathways. Published courses only appear below.
        </p>
      </header>
      <ul className="space-y-4">
        {pathways.map((p) => (
          <li key={p.id} className="border-b pb-4">
            <h2 className="text-xl font-semibold text-teal-900">
              <Link
                href={`/academy/pathways/${p.code ?? p.slug}`}
                className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {p.title}
              </Link>
            </h2>
            <p className="text-sm text-slate-600">
              {p.code}
              {p.badgeName ? ` · ${p.badgeName}` : null}
              {" · "}
              {p.courses.length} published course{p.courses.length === 1 ? "" : "s"}
            </p>
            <p className="text-slate-700">{p.description}</p>
          </li>
        ))}
      </ul>
      {pathways.length === 0 ? (
        <p className="text-slate-600">No pathways yet. Run the catalogue import.</p>
      ) : null}
    </article>
  );
}
