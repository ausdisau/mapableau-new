import Link from "next/link";

import { AccessReportWizard } from "@/components/access-reports/AccessReportWizard";
import { SkipToContent } from "@/components/core/SkipToContent";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function EditAccessReportPage({
  params,
}: {
  params: Promise<{ placeId: string; reportId: string }>;
}) {
  const user = await requireAuth();
  const { placeId, reportId } = await params;

  const [place, report] = await Promise.all([
    getPlaceById(placeId, true),
    prisma.accessPlaceReview.findFirst({
      where: { id: reportId, placeId, reviewerProfileId: user.id, status: "draft" },
    }),
  ]);

  if (!place || !report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p>Draft not found.</p>
        <Link href={`/access/places/${placeId}`} className="underline">
          Back to place
        </Link>
      </div>
    );
  }

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold">Continue draft report</h1>
        <AccessReportWizard
          placeId={placeId}
          placeName={place.name}
          draftId={reportId}
        />
      </main>
    </>
  );
}
