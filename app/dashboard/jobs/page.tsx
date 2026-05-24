import Link from "next/link";

import { JobCard } from "@/components/employment/JobCard";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { phase3Config } from "@/lib/config/phase3";

export const metadata = {
  title: "Jobs | MapAble",
  description: "Inclusive employment opportunities on MapAble.",
};

export default async function DashboardJobsPage() {
  await requireAuth();

  if (!phase3Config.jobsPublicBoardEnabled) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Jobs</h1>
        <p className="text-muted-foreground">The jobs board is not available right now.</p>
      </div>
    );
  }

  const jobs = await prisma.job.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      employmentType: true,
      location: true,
      remoteAllowed: true,
      flexibleHours: true,
      status: true,
      payRange: true,
      description: true,
    },
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Jobs</h1>
        <p className="max-w-2xl text-muted-foreground">
          Employers who welcome reasonable adjustments. You control what you share
          when you apply.
        </p>
        <Link
          href="/dashboard/jobs/applications"
          className="text-sm font-semibold text-primary hover:underline"
        >
          My applications
        </Link>
      </header>
      <ul className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => (
          <li key={job.id}>
            <JobCard job={job} />
          </li>
        ))}
      </ul>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground">No published jobs at the moment.</p>
      ) : null}
    </div>
  );
}
