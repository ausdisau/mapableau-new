import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CoordinatorParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("coordinator:portal");
  const { id } = await params;

  const link = await prisma.supportCoordinatorRelationship.findFirst({
    where: { participantId: id, status: "active" },
  });

  if (!link) {
    return (
      <div className="space-y-4 p-4" role="alert">
        <h1 className="font-heading text-2xl font-bold">Participant</h1>
        <p className="rounded-lg border border-amber-500 bg-amber-50 p-4 text-sm dark:bg-amber-950">
          Consent required. This participant has not authorised support coordinator
          access. Information is hidden to protect their privacy.
        </p>
      </div>
    );
  }

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: id },
  });

  return (
    <div className="space-y-4 p-4">
      <p className="rounded-lg border border-green-600 bg-green-50 p-3 text-sm dark:bg-green-950">
        Consent active. You may view summary information shared by the participant.
      </p>
      <h1 className="font-heading text-2xl font-bold">
        {profile?.displayName ?? "Participant"}
      </h1>
      {profile?.homeSuburb ? (
        <p className="text-muted-foreground">
          Area: {profile.homeSuburb}, {profile.homeState}
        </p>
      ) : null}
    </div>
  );
}
