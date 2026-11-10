import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccessiMartReviewDetail } from "@/components/marketplace/accessimart-review/AccessiMartReviewDetail";
import {
  ACCESSIMART_SYNTHETIC_CATALOGUE,
  getAccessiMartReviewListing,
} from "@/lib/marketplace/accessimart-synthetic-catalogue";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ACCESSIMART_SYNTHETIC_CATALOGUE.map((listing) => ({
    slug: listing.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = getAccessiMartReviewListing(slug);
  if (!listing) {
    return { title: "Listing not found | AccessiMart review" };
  }
  return {
    title: `${listing.name} | AccessiMart review`,
    description: "Review-only AccessiMart listing. Not for purchase.",
    robots: { index: false, follow: false },
  };
}

export default async function AccessiMartReviewDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const listing = getAccessiMartReviewListing(slug);
  if (!listing) notFound();
  return <AccessiMartReviewDetail listing={listing} />;
}
