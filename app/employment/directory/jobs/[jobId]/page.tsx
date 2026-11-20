import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { approvedEmployerIds } from "@/lib/search/domain-directory-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Published job | MapAble Employment",
  description: "Review an approved employer-published role before choosing whether to apply.",
  robots: { index: false, follow: false },
};

export default async function PublicEmploymentListingPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const employerIds = approvedEmployerIds();
  if (!employerIds.length) notFound();

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      status: "published",
      employerOrganisationId: { in: employerIds },
      employerOrganisation: { status: "active" },
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      employmentType: true,
      payRange: true,
      remoteAllowed: true,
      flexibleHours: true,
      adjustmentOpennessStatement: true,
      employerOrganisation: { select: { name: true } },
    },
  });
  if (!job) notFound();

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <nav aria-label="Job browsing" className="text-sm">
        <Link href="/employment/directory" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
          Back to Employment directory
        </Link>
      </nav>
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Employer-published role · MapAble Employment
        </p>
        <h1 className="font-heading text-3xl font-bold">{job.title}</h1>
        <p className="text-lg font-semibold">{job.employerOrganisation.name}</p>
        <p className="text-sm text-muted-foreground">
          Employer-provided listing from an explicitly approved public-publishing organisation.
          Current recruitment status, workplace access, pay conditions and employer claims
          are not independently verified by MapAble.
        </p>
      </header>

      <section aria-label="Role information" className="rounded-2xl border border-border bg-card p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold">Employment type</dt>
            <dd className="mt-1 capitalize">{job.employmentType.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold">Location</dt>
            <dd className="mt-1">{job.location || "Not stated"}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold">Pay information</dt>
            <dd className="mt-1">{job.payRange || "Ask the employer for pay details"}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold">Work arrangements</dt>
            <dd className="mt-1">
              {[
                job.remoteAllowed ? "Employer describes remote work" : null,
                job.flexibleHours ? "Employer describes flexible hours" : null,
              ].filter(Boolean).join(" · ") || "Not specified"}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="job-description" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="job-description" className="text-xl font-bold">Role description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{job.description}</p>
      </section>

      {job.adjustmentOpennessStatement ? (
        <section aria-labelledby="job-adjustments" className="rounded-2xl border border-border bg-card p-5">
          <h2 id="job-adjustments" className="text-xl font-bold">Employer statement on workplace adjustments</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{job.adjustmentOpennessStatement}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            This is a statement from the employer, not independently verified workplace accessibility.
          </p>
        </section>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-800 dark:bg-violet-950/30">
        <h2 className="text-xl font-bold">You control your application</h2>
        <p className="text-sm leading-7">
          You do not need to share a diagnosis to browse this role. Any adjustment requests
          should be shared only after you review and approve the disclosure. Applying uses
          the separate authenticated Jobs workflow; it is not completed from this public page.
        </p>
        <Link
          href={"/dashboard/jobs/" + encodeURIComponent(job.id) + "/apply"}
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Review application (sign-in required)
        </Link>
      </section>

      <p className="text-sm">
        <Link href="/contact" className="font-semibold underline underline-offset-4">
          Report an incorrect or concerning job listing
        </Link>
      </p>
    </main>
  );
}
