import Link from "next/link";
import { notFound } from "next/navigation";

import { HisTheoryBanner } from "@/components/academy/HisTheoryBanner";
import { getPublicPathwayByCode } from "@/lib/academy/catalogue/catalogue-service";

type Props = { params: Promise<{ code: string }> };

export default async function AcademyPathwayDetailPage({ params }: Props) {
  const { code } = await params;
  const pathway = await getPublicPathwayByCode(decodeURIComponent(code));
  if (!pathway) notFound();

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/academy/pathways" className="text-teal-800 underline">
          Pathways
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{pathway.code}</span>
      </nav>
      <header>
        <h1 className="font-heading text-3xl font-bold text-teal-950">{pathway.title}</h1>
        {pathway.badgeName ? (
          <p className="text-sm text-slate-600">Badge: {pathway.badgeName}</p>
        ) : null}
        <p className="mt-2 text-slate-700">{pathway.description}</p>
      </header>
      {pathway.code === "HIS" ? <HisTheoryBanner show /> : null}
      <ol className="list-decimal space-y-3 pl-5">
        {pathway.courses.map((link) => (
          <li key={link.id}>
            <Link
              href={`/academy/catalogue/${link.course.code}`}
              className="text-teal-800 underline"
            >
              {link.course.code} — {link.course.title}
            </Link>
          </li>
        ))}
      </ol>
      {pathway.courses.length === 0 ? (
        <p className="text-slate-600">No published courses in this pathway yet.</p>
      ) : null}
    </article>
  );
}
