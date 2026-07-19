import { BarrierReportForm } from "@/components/barrier-report/BarrierReportForm";
import { ConsistentHelp } from "@/components/help/ConsistentHelp";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Report an access barrier",
  description:
    "Report an access barrier at a place or service. Images are optional. Reporter details are not shown publicly.",
};

export default async function ReportBarrierPage({
  searchParams,
}: {
  searchParams: Promise<{ placeSlug?: string; placeName?: string }>;
}) {
  const params = await searchParams;

  return (
    <PublicInfoPage
      eyebrow="Access feedback"
      title="Report an access barrier"
      description="Tell MapAble what blocked or limited access. You do not need an image. Unknown information should be reported rather than guessed."
      ctaLabel="Contact MapAble"
      ctaHref="/contact?topic=accessibility"
      sections={[
        {
          title: "Report details",
          content: (
            <div className="space-y-4">
              <div className="flex justify-end">
                <ConsistentHelp
                  contextTitle="Barrier reporting"
                  plainLanguage="Use this form to report entrance, toilet, lift, sensory, communication or information problems. You can save a draft and return later. Safety emergencies should use 000."
                  safetyNote="If anyone is in immediate danger, call 000. MapAble is not an emergency service."
                />
              </div>
              {params.placeName ? (
                <p className="text-sm text-slate-700">
                  Place: <strong>{params.placeName}</strong>
                </p>
              ) : null}
              <BarrierReportForm
                placeSlug={params.placeSlug}
                placeName={params.placeName}
              />
            </div>
          ),
        },
      ]}
    />
  );
}
