import Link from "next/link";

import { mapableSectionCardClass } from "@/lib/brand/styles";

export type FoodProductCardProps = {
  id: string;
  title: string;
  priceAmount: number;
  currency?: string;
  category?: string;
  dietaryTags?: string[];
  href?: string;
};

export function FoodProductCard({
  id,
  title,
  priceAmount,
  currency = "AUD",
  category,
  dietaryTags = [],
  href,
}: FoodProductCardProps) {
  const link = href ?? `/foods/products/${id}`;
  const price = (priceAmount / 100).toFixed(2);
  return (
    <article className={mapableSectionCardClass}>
      <Link href={link} className="block p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <h3 className="font-semibold">{title}</h3>
        {category ? (
          <p className="mt-1 text-sm text-muted-foreground">{category}</p>
        ) : null}
        <p className="mt-2 text-lg font-medium" aria-label={`Price ${price} ${currency}`}>
          ${price} {currency}
        </p>
        {dietaryTags.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Dietary tags">
            {dietaryTags.slice(0, 3).map((t) => (
              <li
                key={t}
                className="rounded border border-amber-600/40 bg-amber-50 px-2 py-0.5 text-xs text-amber-950"
              >
                {t.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        ) : null}
      </Link>
    </article>
  );
}
