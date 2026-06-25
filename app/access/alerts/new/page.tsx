import Link from "next/link";

import { AccessAlertForm } from "@/components/access-alerts/AccessAlertForm";
import { SkipToContent } from "@/components/core/SkipToContent";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import { requireAuth } from "@/lib/auth/guards";

export default async function NewAccessAlertPage({
  searchParams,
}: {
  searchParams: Promise<{ placeId?: string }>;
}) {
  await requireAuth();
  const { placeId } = await searchParams;
  const place = placeId ? await getPlaceById(placeId, true) : null;

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <nav className="text-sm">
          <Link
            href={placeId ? `/access/places/${placeId}` : "/access"}
            className="underline"
          >
            Back
          </Link>
        </nav>
        <h1 className="text-2xl font-bold">Flag access alert</h1>
        <AccessAlertForm
          placeId={place?.id}
          placeName={place?.name}
        />
      </main>
    </>
  );
}
