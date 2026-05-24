import { notFound } from "next/navigation";

import { JobApplyForm } from "@/components/employment/JobApplyForm";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function DashboardJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await requireAuth();
  const { jobId } = await params;

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: "published" },
  });
  if (!job) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">{job.title}</h1>
        <p className="text-muted-foreground">
          {job.employmentType.replace(/_/g, " ")}
          {job.location ? ` · ${job.location}` : ""}
        </p>
        {job.adjustmentOpennessStatement ? (
          <p className="text-sm">{job.adjustmentOpennessStatement}</p>
        ) : null}
      </header>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p>{job.description}</p>
      </div>
      <JobApplyForm jobId={job.id} jobTitle={job.title} />
    </div>
  );
}
