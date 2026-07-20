import { requireAdminOpsAccess } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { PBS_POSITIONING } from "@/lib/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "PBS governance | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPbsGovernancePage() {
  await requireAdminOpsAccess();

  if (!pbsConfig.enabled) {
    return (
      <div className="rounded-xl border p-6">
        <h1 className="font-heading text-2xl font-bold">PBS governance</h1>
        <p className="mt-2 text-muted-foreground">
          Module disabled. Ambient admin access never exposes clinical content.
        </p>
      </div>
    );
  }

  const [engagementCount, planCount, aiRunCount] = await Promise.all([
    prisma.pbsEngagement.count(),
    prisma.pbsPlan.count(),
    prisma.pbsAiAssistanceRun.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Positive Behaviour Support governance
      </h1>
      <p className="text-sm text-muted-foreground">{PBS_POSITIONING}</p>
      <p className="text-sm">
        Operational metadata only. Sensitive clinical access requires break-glass
        and an access receipt. publicClaimAllowed: false.
      </p>
      <dl className="grid gap-4 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border p-4">
          <dt className="font-medium">Engagements</dt>
          <dd className="text-2xl">{engagementCount}</dd>
        </div>
        <div className="rounded-lg border p-4">
          <dt className="font-medium">Plans</dt>
          <dd className="text-2xl">{planCount}</dd>
        </div>
        <div className="rounded-lg border p-4">
          <dt className="font-medium">AI assistance runs</dt>
          <dd className="text-2xl">{aiRunCount}</dd>
        </div>
      </dl>
      <ul className="list-disc pl-6 text-sm">
        <li>MAPABLE_PBS_ENABLED: {String(pbsConfig.enabled)}</li>
        <li>
          MAPABLE_PBS_EXTERNAL_MODEL_ENABLED:{" "}
          {String(pbsConfig.externalModelEnabled)}
        </li>
        <li>
          MAPABLE_PBS_PUBLIC_CLAIM_ENABLED:{" "}
          {String(pbsConfig.publicClaimEnabled)}
        </li>
      </ul>
    </div>
  );
}
