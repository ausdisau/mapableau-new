import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { BusinessAccessSelfCheckForm } from "@/components/resources/business/BusinessAccessSelfCheckForm";
import { BusinessAccessStatementGenerator } from "@/components/resources/business/BusinessAccessStatementGenerator";
import { BusinessResourcePageContent } from "@/components/resources/business/BusinessResourcePageContent";
import {
  businessResources,
  getBusinessResourceBySlug,
} from "@/lib/resources/business-resources-data";

type BusinessResourcePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return businessResources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({
  params,
}: BusinessResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = getBusinessResourceBySlug(slug);
  if (!resource) {
    return { title: "Business Access Resource | MapAble" };
  }
  return {
    title: `${resource.title} | MapAble`,
    description: resource.summary,
    alternates: { canonical: resource.href },
  };
}

export default async function BusinessResourcePage({
  params,
}: BusinessResourcePageProps) {
  const { slug } = await params;
  const resource = getBusinessResourceBySlug(slug);
  if (!resource) {
    notFound();
  }

  let interactive: React.ReactNode = null;
  if (slug === "access-barrier-self-check") {
    interactive = <BusinessAccessSelfCheckForm />;
  } else if (slug === "accessibility-statement-generator") {
    interactive = <BusinessAccessStatementGenerator />;
  } else if (slug === "venue-accessibility-self-check") {
    interactive = (
      <BusinessAccessSelfCheckForm />
    );
  }

  return (
    <BusinessResourcePageContent resource={resource}>
      {interactive}
    </BusinessResourcePageContent>
  );
}
