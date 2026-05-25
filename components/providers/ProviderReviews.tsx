import React from "react";
import { Star } from "lucide-react";

import type { PublicProviderReview } from "@/types/provider-profile";

type ProviderReviewsProps = {
  rating: number;
  reviewCount: number;
  reviews: PublicProviderReview[];
};

export function ProviderReviews({
  rating,
  reviewCount,
  reviews,
}: ProviderReviewsProps) {
  return (
    <section aria-labelledby="reviews-heading" className="space-y-4">
      <h2
        id="reviews-heading"
        className="font-heading text-xl font-semibold text-foreground"
      >
        Reviews
      </h2>
      {reviewCount > 0 && rating > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
          <span>
            Average <strong className="text-foreground">{rating.toFixed(1)}</strong>{" "}
            from {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </span>
        </p>
      ) : null}
      {reviews.length > 0 ? (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-lg border border-border/60 bg-card p-4"
            >
              <p className="text-sm font-medium text-foreground">
                {review.authorLabel}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {review.rating.toFixed(1)} / 5
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Individual reviews are shown only when participants choose to share
          them. Check back later or ask the provider for references.
        </p>
      )}
    </section>
  );
}
