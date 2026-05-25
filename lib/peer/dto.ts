import type {
  PeerDisplayNameMode,
  PeerProfile,
  PeerProfileVisibility,
  User,
} from "@prisma/client";

export type PeerProfileDto = {
  id: string;
  profileSlug: string;
  displayName: string;
  displayNameMode: PeerDisplayNameMode;
  livedExperienceTags: string[] | null;
  profileVisibility: PeerProfileVisibility;
  status: string;
};

export function resolvePublicDisplayName(
  profile: Pick<PeerProfile, "displayName" | "displayNameMode">,
  user?: Pick<User, "name"> | null
): string {
  switch (profile.displayNameMode) {
    case "real_name":
      return user?.name?.trim() || profile.displayName;
    case "first_name_only": {
      const source = user?.name?.trim() || profile.displayName;
      return source.split(/\s+/)[0] ?? profile.displayName;
    }
    case "anonymous_public":
      return "Community member";
    case "community_alias":
    default:
      return profile.displayName;
  }
}

export function toPeerProfileDto(
  profile: PeerProfile,
  user?: Pick<User, "name"> | null
): PeerProfileDto {
  return {
    id: profile.id,
    profileSlug: profile.profileSlug,
    displayName: resolvePublicDisplayName(profile, user),
    displayNameMode: profile.displayNameMode,
    livedExperienceTags: Array.isArray(profile.livedExperienceTags)
      ? (profile.livedExperienceTags as string[])
      : null,
    profileVisibility: profile.profileVisibility,
    status: profile.status,
  };
}

export function stripParticipantFields<T extends Record<string, unknown>>(
  data: T
): Omit<T, "ndisParticipantNumberEnc" | "participantNotes" | "adminNotes"> {
  const { ndisParticipantNumberEnc, participantNotes, adminNotes, ...rest } =
    data as T & {
      ndisParticipantNumberEnc?: unknown;
      participantNotes?: unknown;
      adminNotes?: unknown;
    };
  void ndisParticipantNumberEnc;
  void participantNotes;
  void adminNotes;
  return rest;
}
