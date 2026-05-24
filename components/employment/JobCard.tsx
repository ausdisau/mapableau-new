import React from "react";
import Link from "next/link";

import type { JobSummary } from "@/types/employment";

type JobCardProps = {
  job: JobSummary & { description?: string; payRange?: string | null };
};

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {job.title}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {job.employmentType.replace(/_/g, " ")}
        {job.location ? ` · ${job.location}` : ""}
        {job.remoteAllowed ? " · Remote OK" : ""}
        {job.flexibleHours ? " · Flexible hours" : ""}
      </p>
      {job.payRange ? (
        <p className="mt-2 text-sm">Pay: {job.payRange}</p>
      ) : null}
    </article>
  );
}
