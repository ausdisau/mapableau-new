import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { PBS_POSITIONING } from "@/lib/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "PBS practitioner workspace" };
export const dynamic = "force-dynamic";

export default async function PractitionerPbsPage() {
  if (!pbsConfig.enabled) {
    return (
      <div className="rounded-xl border p-6">
        <h1 className="font-heading text-2xl font-bold">
          Practitioner PBS workspace
        </h1>
        <p className="mt-2 text-muted-foreground">Module disabled.</p>
      </div>
    );
  }

  const user = await requireAuth();
  const profiles = await prisma.pbsPractitionerProfile.findMany({
    where: { userId: user.id },
    include: {
      engagementsAsPractitioner: {
        take: 50,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">
        Practitioner Positive Behaviour Support
      </h1>
      <p className="text-sm text-muted-foreground">{PBS_POSITIONING}</p>
      <p className="text-sm">
        Claimed credentials are not shown as verified until a human verification
        record exists. Only verified assigned practitioners may finalise plans.
      </p>
      {profiles.length === 0 ? (
        <p className="text-sm">No practitioner profile in this environment.</p>
      ) : (
        <ul className="space-y-3">
          {profiles.flatMap((p) =>
            p.engagementsAsPractitioner.map((e) => (
              <li key={e.id} className="rounded-lg border p-4 text-sm">
                <Link
                  className="underline"
                  href={`/practitioner/positive-behaviour-support/engagements/${e.id}`}
                >
                  Engagement {e.id.slice(0, 8)} · {e.status}
                </Link>
                <p>
                  Suitability: {p.suitabilityStatus}
                  {p.suitabilityStatus !== "verified"
                    ? " (not verified — cannot finalise)"
                    : ""}
                </p>
              </li>
            )),
          )}
        </ul>
      )}
    </div>
  );
}
