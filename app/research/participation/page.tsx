import Link from "next/link";

import { ResearchGovernanceNotice } from "@/components/analytics/ResearchGovernanceNotice";
import { requireAuth } from "@/lib/auth/guards";
import { listParticipantProgrammes } from "@/lib/research/co-design-governance-service";
import { analyticsResearchConfig } from "@/lib/config/analytics-research";

export const metadata = {
  title: "Research participation | MapAble",
  description: "Disability-led co-design and research participation — optional and consent-based.",
};

export default async function ResearchParticipationPage() {
  const user = await requireAuth();
  const userId = user.id;

  const enrollments =
    analyticsResearchConfig.researchGovernanceEnabled
      ? await listParticipantProgrammes(userId)
      : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Research participation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Co-design and research programmes are optional. Core MapAble navigation and
          services never require research enrolment.
        </p>
      </header>

      <ResearchGovernanceNotice />

      <section aria-labelledby="enrolments-heading" className="space-y-4">
        <h2 id="enrolments-heading" className="font-heading text-lg font-semibold">
          Your programmes
        </h2>
        {!analyticsResearchConfig.researchGovernanceEnabled ? (
          <p className="text-sm text-muted-foreground" role="status">
            Research governance is not enabled on this environment.
          </p>
        ) : enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You are not enrolled in any co-design or research programmes.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {enrollments.map((enrollment) => (
              <li key={enrollment.id} className="space-y-2 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{enrollment.programme.title}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">
                    {enrollment.role.replace(/_/g, " ")}
                  </span>
                </div>
                {enrollment.programme.plainLanguageSummary ? (
                  <p className="text-muted-foreground">
                    {enrollment.programme.plainLanguageSummary}
                  </p>
                ) : null}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Research consent (separate from service consent)
                  </h3>
                  <ul className="mt-1 space-y-1">
                    {enrollment.programme.consentRecords.length === 0 ? (
                      <li className="text-muted-foreground">No purpose-specific consent recorded yet.</li>
                    ) : (
                      enrollment.programme.consentRecords.map((consent) => (
                        <li key={consent.id}>
                          <span className="font-medium">{consent.purpose.replace(/_/g, " ")}</span>
                          {" — "}
                          <span>{consent.status}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="text-sm">
        <Link href="/my" className="underline">
          Back to your dashboard
        </Link>
      </nav>
    </div>
  );
}
