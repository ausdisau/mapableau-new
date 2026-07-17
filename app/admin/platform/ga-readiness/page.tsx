import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function GaReadinessPage() {
  await requirePermission("platform:ga:read");
  const assessments = await prisma.generalAvailabilityAssessment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { organisation: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">General availability</h1>
        <p className="mt-2 max-w-3xl text-sm">
          GA assessments are <strong>advisory</strong> until a named executive
          approves. AI cannot approve GA. Env flags and passing tests do not
          equal GA.
        </p>
      </header>
      {assessments.length === 0 ? (
        <p>No GA assessments recorded. Tenants remain not_assessed.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {assessments.map((a) => (
            <li key={a.id}>
              <strong>{a.organisation.name}</strong> · {a.decision} ·{" "}
              advisoryOnly={String(a.advisoryOnly)} · executive={" "}
              {a.executiveUserId ? "yes" : "no"} · {a.createdAt.toISOString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
