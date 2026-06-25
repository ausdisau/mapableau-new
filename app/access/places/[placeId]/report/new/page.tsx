import Link from "next/link";

import { AccessReportWizard } from "@/components/access-reports/AccessReportWizard";
import { AccessibilityDisclaimerPanel } from "@/components/access/AccessibilityDisclaimerPanel";
import { SkipToContent } from "@/components/core/SkipToContent";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import { requireAuth } from "@/lib/auth/guards";

export default async function NewAccessReportPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  await requireAuth();
  const { placeId } = await params;
  const place = await getPlaceById(placeId, true);
  if (!place) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p>Place not found.</p>
        <Link href="/access" className="underline">
          Back to map
        </Link>
      </div>
    );
  }

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <nav className="text-sm">
          <Link href={`/access/places/${placeId}`} className="underline">
            Back to {place.name}
          </Link>
        </nav>
        <h1 className="text-2xl font-bold">Add access report</h1>
        <AccessReportWizard placeId={placeId} placeName={place.name} />
        <AccessibilityDisclaimerPanel />
      </main>
    </>
  );
}
