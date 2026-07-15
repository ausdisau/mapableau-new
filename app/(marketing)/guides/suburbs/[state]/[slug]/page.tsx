import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { SuburbGuidePageContent } from "@/components/guides/suburb/SuburbGuidePageContent";
import {
  getSuburbGuideByStateSlug,
  isSuburbGuideIndexable,
  suburbAccessGuides,
} from "@/lib/resources/suburb-access-guides-data";

type SuburbGuidePageProps = {
  params: Promise<{ state: string; slug: string }>;
};

export function generateStaticParams() {
  return suburbAccessGuides.map((guide) => ({
    state: guide.stateSlug,
    slug: guide.slug,
  }));
}

export async function generateMetadata({
  params,
}: SuburbGuidePageProps): Promise<Metadata> {
  const { state, slug } = await params;
  const guide = getSuburbGuideByStateSlug(state, slug);
  if (!guide) {
    return { title: "Suburb Access Guide | MapAble" };
  }

  const indexable = isSuburbGuideIndexable(guide);
  const canonical = guide.href;

  return {
    title: `${guide.name} Access Guide | MapAble`,
    description: guide.accessSummary,
    alternates: { canonical },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function SuburbGuideDetailPage({
  params,
}: SuburbGuidePageProps) {
  const { state, slug } = await params;
  const guide = getSuburbGuideByStateSlug(state, slug);
  if (!guide) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au";
  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${guide.name}, ${guide.state}`,
    identifier: guide.salCode,
    geo: {
      "@type": "GeoCoordinates",
      latitude: guide.centroid.latitude,
      longitude: guide.centroid.longitude,
    },
    url: `${baseUrl}${guide.href}`,
    description: guide.accessSummary,
  };

  return (
    <>
      {isSuburbGuideIndexable(guide) ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
        />
      ) : null}
      <SuburbGuidePageContent guide={guide} showMap />
    </>
  );
}
