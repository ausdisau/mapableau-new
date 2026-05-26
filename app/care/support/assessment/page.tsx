import { AssessmentWizardForm } from "@/components/care-support/AssessmentWizardForm";

export default async function CareSupportAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div>
      <h1 className="mb-2 font-heading text-2xl font-bold">Support needs assessment</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tell us about your goals, daily living, and access needs. You can save a draft and submit
        when ready.
      </p>
      <AssessmentWizardForm assessmentId={id} />
    </div>
  );
}
