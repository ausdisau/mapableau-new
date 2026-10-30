import Link from "next/link";
import { CorePageHeader } from "@/components/core/CorePageHeader";
export const metadata = {
  title: "Your support needs assessment | MapAble",
  description: "Record support needs and prepare for an assessment on your terms.",
};
export default function AssessmentInformationPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <CorePageHeader eyebrow="MapAble • Participant-owned" title="Your needs. Your words. Your choices."
        description="Make a support needs statement, document the supports you use and compare it with a later assessor report." />
      <section className="space-y-3 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">What you can do</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Describe goals, communication access, support requirements and changing needs.</li>
          <li>Save your own account and document evidence you choose to provide.</li>
          <li>Review differences between your statement and an assessor's report.</li>
          <li>Prepare a request for correction, clarification or review.</li>
        </ul>
      </section>
      <div className="rounded-xl border p-5">
        <p className="mb-4">MapAble does not conduct an official NDIA assessment, calculate an I-CAN score or determine NDIS eligibility. This is an optional planning tool.</p>
        <div className="flex flex-wrap gap-4">
          <Link className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground" href="/signup/assessment">Create an account</Link>
          <Link className="rounded-lg border px-5 py-3 font-semibold" href="/login?callbackUrl=%2Fdashboard%2Fassessment">Sign in to continue</Link>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">You can create your MapAble account without completing an assessment. You remain in control of what you share.</p>
    </main>
  );
}
