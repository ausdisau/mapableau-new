import { notFound } from "next/navigation";

import { EmbedMapFrame } from "@/components/embed/EmbedMapFrame";

type PageProps = {
  params: Promise<{ locationId: string }>;
};

function isSafeLocationId(locationId: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(locationId);
}

/**
 * Embed destination — stripped map shell for provider iframes.
 * Framing is allowed via middleware / next.config CSP frame-ancestors override.
 */
export default async function EmbedLocationPage({ params }: PageProps) {
  const { locationId } = await params;
  if (!isSafeLocationId(locationId)) notFound();

  return <EmbedMapFrame locationId={locationId} />;
}
