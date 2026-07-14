import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedPathwayBySlug } from "@/lib/academy/catalogue/catalogue-service";

type Props = { params: Promise<{ slug: string }> };

export default async function AcademyPathwayPage({ params }: Props) {
  const { slug } = await params;
  const pathway = await getPublishedPathwayBySlug(slug);
  if (!pathway) notFound();

  return (
    <article className="space-y-6">
      <h1 className="font-heading text-3xl font-bold text-teal-950">{pathway.title}</h1>
      <p className="text-slate-700">{pathway.description}</p>
      <ol className="list-decimal space-y-3 pl-5">
        {pathway.courses.map((link) => (
          <li key={link.id}>
            <Link
              href={`/academy/courses/${link.course.slug}`}
              className="text-teal-800 underline"
            >
              {link.course.title}
            </Link>
          </li>
        ))}
      </ol>
    </article>
  );
}
