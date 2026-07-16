import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview access orchestration | Employer",
  description: "Coordinate interview and first-day accessibility with approved fields only.",
};

export default function EmployerAccessOrchestrationPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Interview and first-day access</h1>
      <p className="mt-3">
        Employer view for scheduling adjustments, reception instructions, and
        workplace access — without diagnosis disclosure, risk scores, or automatic
        candidate rejection.
      </p>
      <p className="mt-3">
        Flag: <code>ACCESS_INTELLIGENCE_EMPLOYMENT_ORCHESTRATOR</code>
      </p>
    </main>
  );
}
