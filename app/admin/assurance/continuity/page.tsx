import Link from "next/link";

import { evaluateContinuityChecks } from "@/lib/assurance/continuity/continuity-checks";
import { DEFAULT_RECOVERY_OBJECTIVES } from "@/lib/assurance/recovery/recovery-objectives";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AssuranceContinuityPage() {
  await requireAdmin();

  const latestExercise = await prisma.incidentResponseExercise.findFirst({
    where: { conductedAt: { not: null } },
    orderBy: { conductedAt: "desc" },
  });

  const restoreTestedWithinDays = latestExercise?.conductedAt
    ? Math.floor(
        (Date.now() - latestExercise.conductedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const checks = evaluateContinuityChecks({
    backupConfigured: process.env.DISASTER_RECOVERY_EXERCISES_ENABLED === "true",
    restoreTestedWithinDays,
    maxRestoreAgeDays: 365,
  });

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Business continuity</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Continuity checks passing does not certify compliance. Feature flags are not
        readiness.
      </p>

      <section aria-labelledby="objectives-heading">
        <h2 id="objectives-heading" className="font-heading text-lg font-semibold">
          Recovery objectives
        </h2>
        <ul className="list-disc pl-6 text-sm">
          <li>RPO: {DEFAULT_RECOVERY_OBJECTIVES.rpoHours} hours</li>
          <li>RTO: {DEFAULT_RECOVERY_OBJECTIVES.rtoHours} hours</li>
        </ul>
      </section>

      <section aria-labelledby="checks-heading">
        <h2 id="checks-heading" className="font-heading text-lg font-semibold">
          Continuity checks
        </h2>
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.key} className="text-sm">
              <span className="font-medium">{check.key}</span>:{" "}
              {check.ok ? "ok" : "gap"} — {check.detail}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
