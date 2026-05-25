import type { PeerProfile } from "@prisma/client";

import { checkConsent } from "@/lib/consent/consent-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export class PeerAccessError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "PeerAccessError";
  }
}

export async function getActivePeerProfileForUser(userId: string) {
  return prisma.peerProfile.findFirst({
    where: { userId, status: "active" },
    include: { privacySettings: true, user: { select: { name: true, email: true } } },
  });
}

export async function requireActivePeerProfile(userId: string) {
  const profile = await getActivePeerProfileForUser(userId);
  if (!profile) {
    throw new PeerAccessError("Peer profile required", "PEER_PROFILE_REQUIRED");
  }
  return profile;
}

export function assertPeerProfileOwner(
  userId: string,
  profile: Pick<PeerProfile, "userId">
) {
  if (profile.userId !== userId) {
    throw new PeerAccessError("Not profile owner", "PEER_PROFILE_FORBIDDEN");
  }
}

export async function assertCanViewPeerActivity(
  viewer: CurrentUser,
  subjectUserId: string
) {
  if (viewer.id === subjectUserId) return;
  if (hasPermission(viewer.primaryRole, "peer:admin")) return;
  if (hasPermission(viewer.primaryRole, "peer:moderate")) return;

  const coordinatorRoles = ["support_coordinator", "provider_admin", "plan_manager"];
  if (coordinatorRoles.includes(viewer.primaryRole)) {
    const granted = await checkConsent({
      subjectUserId,
      grantedToUserId: viewer.id,
      scope: "peer.activity.read",
    });
    if (!granted) {
      throw new PeerAccessError(
        "Peer activity requires explicit consent",
        "PEER_CONSENT_REQUIRED"
      );
    }
  }
}

export async function assertMentorCannotAccessParticipantRecords(
  mentorUserId: string,
  participantUserId: string
) {
  const participantProfile = await prisma.participantProfile.findUnique({
    where: { userId: participantUserId },
    select: { id: true, ndisParticipantNumberEnc: true },
  });
  if (!participantProfile) return;

  const careConsent = await checkConsent({
    subjectUserId: participantUserId,
    grantedToUserId: mentorUserId,
    scope: "care.accessibility_share",
  });
  if (!careConsent) {
    throw new PeerAccessError(
      "Mentors cannot access participant support records by default",
      "MENTOR_PARTICIPANT_RECORDS_FORBIDDEN"
    );
  }
}

export async function assertCircleMembership(
  peerProfileId: string,
  circleId: string
) {
  const member = await prisma.peerCircleMember.findUnique({
    where: {
      circleId_peerProfileId: { circleId, peerProfileId },
    },
  });
  if (!member) {
    throw new PeerAccessError("Not a circle member", "PEER_CIRCLE_FORBIDDEN");
  }
}

export function assertPeerCommunityAccess(user: CurrentUser) {
  if (
    !hasPermission(user.primaryRole, "peer:access") &&
    !hasPermission(user.primaryRole, "peer:mentor:manage:self")
  ) {
    throw new PeerAccessError("Peer access denied", "PEER_ACCESS_DENIED");
  }
}
