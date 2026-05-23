import Link from "next/link";
import { notFound } from "next/navigation";

import { mapIntakeToRequestPaths } from "@/lib/intake/intake-to-request-mapper";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function IntakeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const session = await prisma.intakeSession.findFirst({
    where: { id, participantId: user.id },
  });
  if (!session) notFound();

  const extraction = session.extractionJson as {
    supportType?: string;
    draftSummary?: string;
    uncertainties?: string[];
  } | null;

  const paths = mapIntakeToRequestPaths({
    supportType: extraction?.supportType as "care" | "transport" | undefined,
  });

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Review your request</h1>
      <p className="text-sm text-muted-foreground">
        Confirm before anything is created. You stay in control.
      </p>
      {extraction?.draftSummary ? (
        <p className="rounded border p-4 text-sm">{extraction.draftSummary}</p>
      ) : null}
      <ul className="list-disc pl-5 text-sm">
        {(extraction?.uncertainties ?? []).map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        {paths.map((href) => (
          <Link key={href} href={href} className="min-h-11 rounded border p-3 text-center underline">
            Continue to {href}
          </Link>
        ))}
      </div>
    </main>
  );
}
