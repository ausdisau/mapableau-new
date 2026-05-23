import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function LensReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const task = await prisma.lensReviewTask.findUnique({
    where: { id },
    include: { upload: true },
  });
  if (!task) notFound();

  const observation = task.observationJson as {
    uncertainties?: string[];
  } | null;

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Review observation</h1>
      <p className="text-sm text-muted-foreground">
        Draft only — confirm before publishing to a place page.
      </p>
      <ul className="list-disc pl-5 text-sm">
        {(observation?.uncertainties ?? ["No analysis yet."]).map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
    </main>
  );
}
