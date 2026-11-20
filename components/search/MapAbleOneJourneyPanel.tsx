import Link from "next/link";

import type { DirectoryDomain } from "@/lib/search/domain-directory-taxonomy";

type JourneyStep = {
  title: string;
  description: string;
  status: "directory_preview" | "existing_gated" | "planned";
};

const JOURNEYS: Record<DirectoryDomain, readonly JourneyStep[]> = {
  jobs: [
    {
      title: "Discover and compare",
      description: "Compare imported employment support outlets and explicitly approved published roles with original source labels.",
      status: "directory_preview",
    },
    {
      title: "Choose what to share",
      description: "Job seeker decides whether to apply and separately approves any workplace-adjustment disclosure.",
      status: "existing_gated",
    },
    {
      title: "Coordinate interviews and support",
      description: "Propose interview times, transport or care support, subject to each service's own approval and availability.",
      status: "planned",
    },
    {
      title: "Track service evidence",
      description: "Keep time records, employer milestones and service records distinct from billing approval or job outcomes.",
      status: "planned",
    },
  ],
  rehabilitation: [
    {
      title: "Discover a discipline",
      description: "Search imported therapy-service classifications without inferring clinician registration or appointment capacity.",
      status: "directory_preview",
    },
    {
      title: "Confirm provider suitability",
      description: "Practitioner, access, costs and appointment availability need direct review before a request proceeds.",
      status: "planned",
    },
    {
      title: "Plan and document care",
      description: "Clinician-managed rehabilitation plans remain restricted; appointment and waitlist orchestration is a separate pilot.",
      status: "existing_gated",
    },
    {
      title: "Review evidence and invoices",
      description: "Participant reviews service delivery; practitioner notes do not automatically become public or create payable claims.",
      status: "planned",
    },
  ],
};

const STATUS: Record<JourneyStep["status"], string> = {
  directory_preview: "Directory preview",
  existing_gated: "Existing separate, gated workflow",
  planned: "Future integration",
};

export function MapAbleOneJourneyPanel({ domain }: { domain: DirectoryDomain }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="one-journey">
      <p className="text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
        MapAble One · Proposed operating model
      </p>
      <h2 id="one-journey" className="mt-2 font-heading text-xl font-bold">
        From discovery to supported service delivery
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        One accessible account and shared booking, consent, calendar and finance infrastructure,
        with specialist employment and rehabilitation data retained in their original domains.
        These are staged capabilities, not an operational booking promise.
      </p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {JOURNEYS[domain].map((step, index) => (
          <li key={step.title} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Step {index + 1} · {STATUS[step.status]}
            </p>
            <h3 className="mt-1 font-bold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm">
        <Link href="/provider" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Existing provider control panel (sign-in required)
        </Link>
      </p>
    </section>
  );
}
