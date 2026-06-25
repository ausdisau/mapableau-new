import Link from "next/link";

import { resourceArticles } from "@/content/resources/articles";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Resources | MapAble",
  description: "Guides for accessible places, NDIS navigation, transport, employment, and community mapping.",
};

const categories = [...new Set(resourceArticles.map((a) => a.category))];

export default function ResourcesPage() {
  return (
    <div>
      <PublicInfoPage
        eyebrow="Resources"
        title="Practical guides for access, support, and community trust"
        description="Australian English, plain language, and review dates on every article. Not medical or legal advice."
        ctaLabel="Join early access"
        ctaHref="/early-access"
        sections={[
          {
            title: "Browse by category",
            content: (
              <ul className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li key={category}>
                    <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{category}</span>
                  </li>
                ))}
              </ul>
            ),
          },
          {
            title: "Articles",
            content: (
              <ul className="space-y-4">
                {resourceArticles.map((article) => (
                  <li key={article.slug} className="rounded-xl border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {article.category}
                    </p>
                    <h3 className="mt-1 text-lg font-bold">
                      <Link href={`/resources/${article.slug}`} className="hover:underline">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{article.excerpt}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Reviewed {article.reviewedAt}</p>
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />
    </div>
  );
}
