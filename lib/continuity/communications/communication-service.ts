/**
 * Wave 11 — Continuity communications.
 *
 * Records a communication attempt for a continuity case. If consent for the
 * channel is missing, the attempt is recorded with status
 * `suppressed_no_consent` — nothing is actually sent.
 */

import type { ContinuityCommunicationAttempt, ContinuityCommunicationChannel } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface DraftCommunicationInput {
  caseId: string;
  channel: ContinuityCommunicationChannel;
  toReference: string;
  bodySnapshot?: string;
  consentGranted: boolean;
  now?: Date;
}

export async function draftCommunication(input: DraftCommunicationInput): Promise<ContinuityCommunicationAttempt> {
  if (!input.consentGranted) {
    return prisma.continuityCommunicationAttempt.create({
      data: {
        caseId: input.caseId,
        channel: input.channel,
        status: "suppressed_no_consent",
        toReference: input.toReference,
        bodySnapshot: input.bodySnapshot,
        suppressedReason: "no_channel_consent",
      },
    });
  }
  return prisma.continuityCommunicationAttempt.create({
    data: {
      caseId: input.caseId,
      channel: input.channel,
      status: "drafted",
      toReference: input.toReference,
      bodySnapshot: input.bodySnapshot,
    },
  });
}
