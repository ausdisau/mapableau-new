import Link from "next/link";
import { notFound } from "next/navigation";

import { getResourceBySlug, resourceArticles } from "@/content/resources/articles";
import { LinkButton } from "@/components/ui/link-button";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return resourceArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getResourceBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | MapAble Resources`,
    description: article.excerpt,
  };
}

export default async function ResourceArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getResourceBySlug(slug);
  if (!article) notFound();

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{article.category}</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{article.title}</h1>
      <p className="mt-3 text-muted-foreground">{article.excerpt}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        By {article.author} · Reviewed {article.reviewedAt}
      </p>

      <nav aria-label="Table of contents" className="mt-8 rounded-xl border border-border p-4">
        <h2 className="text-sm font-bold">In this article</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {article.body.map((paragraph, index) => (
            <li key={paragraph}>
              <a href={`#section-${index + 1}`} className="text-primary hover:underline">
                Section {index + 1}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="prose prose-slate mt-8 max-w-none">
        {article.body.map((paragraph, index) => (
          <section key={paragraph} id={`section-${index + 1}`} className="mb-6">
            <p>{paragraph}</p>
          </section>
        ))}
      </article>

      {article.cta ? (
        <div className="mt-8">
          <LinkButton href={article.cta.href}>{article.cta.label}</LinkButton>
        </div>
      ) : null}

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/resources" className="text-primary underline">
          ← Back to resources
        </Link>
      </p>
    </main>
  );
}
