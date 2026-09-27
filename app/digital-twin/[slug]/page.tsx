import Link from "next/link";
import { notFound } from "next/navigation";

import { DigitalTwinPlaceDetail } from "@/components/digital-twin/DigitalTwinPlaceDetail";
import { getPlaceBySlug } from "@/lib/digital-twin/digital-twin-service";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const bundle = getPlaceBySlug(slug);
  if (!bundle) return { title: "Place not found | MapAble Digital Twin" };
  return {
    title: `${bundle.place.name} | MapAble Digital Twin`,
    description: bundle.place.accessSummaryPlainLanguage,
  };
}

export default async function DigitalTwinDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = getPlaceBySlug(slug);
  if (!bundle) notFound();

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <Link href="/digital-twin" className="text-[#005B7F] hover:underline">
          ← Digital Twin explorer
        </Link>
      </nav>
      <DigitalTwinPlaceDetail bundle={bundle} />
    </main>
  );
}
