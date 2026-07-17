import { prisma } from "@/lib/prisma";

export async function markPilotInformationProvided(input: {
  pilotId: string;
  participantId: string;
}) {
  return prisma.pilotParticipantEnrolment.update({
    where: {
      pilotId_participantId: {
        pilotId: input.pilotId,
        participantId: input.participantId,
      },
    },
    data: {
      status: "information_provided",
      informationProvidedAt: new Date(),
    },
  });
}

export function buildPilotInformationPack(input: {
  pilotName: string;
  stage: string;
  supportItemAllowlist: string[];
  summary: string | null;
}): { title: string; body: string; items: string[] } {
  return {
    title: `Pilot information: ${input.pilotName}`,
    body:
      input.summary ??
      "This is a controlled pilot. Participation is voluntary and requires explicit pilot consent.",
    items: [
      `Stage: ${input.stage}`,
      `Allowlisted support items: ${input.supportItemAllowlist.length === 0 ? "none (deny all)" : input.supportItemAllowlist.join(", ")}`,
      "Ordinary platform consent is not pilot consent.",
      "You may withdraw pilot consent at any time.",
      "No real NDIA submission occurs without separate claim approval governance.",
    ],
  };
}
