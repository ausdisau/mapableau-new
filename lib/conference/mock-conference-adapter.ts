import type { ConferenceAdapter, ConferenceRoomResult, ConferenceTokenResult } from "@/lib/conference/conference-adapter";
import type { ConferenceMode } from "@/types/messages";

export function createMockConferenceAdapter(): ConferenceAdapter {
  return {
    async createRoom({ threadId, mode }) {
      const externalRoomId = `mock-${threadId}-${mode}-${Date.now()}`;
      const base =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
        "http://localhost:3000";
      return {
        externalRoomId,
        roomUrl: `${base}/messages?mockConference=${externalRoomId}`,
      };
    },
    async createMeetingToken({ externalRoomId, profileId, displayName, mode }) {
      const base =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
        "http://localhost:3000";
      const token = Buffer.from(
        JSON.stringify({ externalRoomId, profileId, displayName, mode })
      ).toString("base64url");
      return {
        token,
        roomUrl: `${base}/messages?mockConference=${externalRoomId}&token=${token}`,
      };
    },
    async endRoom() {
      return undefined;
    },
  };
}
