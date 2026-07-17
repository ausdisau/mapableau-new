import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { buildPilotInformationPack } from "@/lib/pilot/enrolment/participant-information-service";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ pilotId: string }> };

export default async function ParticipantPilotDetailPage({ params }: Props) {
  const user = await requirePermission("participant:pilot:view");
  const { pilotId } = await params;

  const enrolment = await prisma.pilotParticipantEnrolment.findUnique({
    where: {
      pilotId_participantId: { pilotId, participantId: user.id },
    },
    include: { pilot: true },
  });
  if (!enrolment) notFound();

  const pack = buildPilotInformationPack({
    pilotName: enrolment.pilot.name,
    stage: enrolment.pilot.stage,
    supportItemAllowlist: enrolment.pilot.supportItemAllowlist,
    summary: enrolment.pilot.summary,
  });

  const isLimitedLive =
    enrolment.pilot.stage === "limited_live" ||
    enrolment.pilot.stage === "controlled_live";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <p>
        <Link href="/participant/pilots" className="text-sm underline">
          Back to your pilots
        </Link>
      </p>
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{enrolment.pilot.name}</h1>
        <p className="text-sm">
          Enrolment status: {enrolment.status.replace(/_/g, " ")}
        </p>
      </header>

      <div className="rounded-lg border p-4" role="status">
        <p className="font-medium">
          Environment:{" "}
          {isLimitedLive
            ? "Limited live (controlled exposure)"
            : "Sandbox / non-live"}
        </p>
        <p className="mt-1 text-sm">
          This is not a production approval. There is no Submit to NDIA action
          for participants on this page.
        </p>
      </div>

      <section aria-labelledby="info" className="space-y-2">
        <h2 id="info" className="font-heading text-lg font-semibold">
          {pack.title}
        </h2>
        <p>{pack.body}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {pack.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="consent" className="space-y-2">
        <h2 id="consent" className="font-heading text-lg font-semibold">
          Consent
        </h2>
        <p className="text-sm">
          Pilot consent recorded:{" "}
          {enrolment.pilotConsentAt
            ? enrolment.pilotConsentAt.toISOString()
            : "not yet"}
        </p>
        <p className="text-sm">
          Use the participant pilot consent and withdraw APIs (or your support
          worker) to record or withdraw pilot consent. You can withdraw at any
          time.
        </p>
      </section>
    </div>
  );
}
