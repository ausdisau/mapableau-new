import type { ConferenceMode } from "@/types/messages";

export interface ConferenceRoomResult {
  externalRoomId: string;
  roomUrl: string;
}

export interface ConferenceTokenResult {
  token: string;
  roomUrl: string;
}

export interface ConferenceAdapter {
  createRoom(params: {
    threadId: string;
    mode: ConferenceMode;
    expiresAt?: Date;
  }): Promise<ConferenceRoomResult>;
  createMeetingToken(params: {
    externalRoomId: string;
    profileId: string;
    displayName: string;
    mode: ConferenceMode;
  }): Promise<ConferenceTokenResult>;
  endRoom(externalRoomId: string): Promise<void>;
}

let adapterInstance: ConferenceAdapter | null = null;

export function getConferenceAdapter(): ConferenceAdapter {
  if (adapterInstance) return adapterInstance;

  const provider = process.env.CONFERENCE_PROVIDER ?? "mock";
  if (provider === "daily" && process.env.DAILY_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createDailyConferenceAdapter } = require("./daily-conference-adapter") as {
      createDailyConferenceAdapter: () => ConferenceAdapter;
    };
    adapterInstance = createDailyConferenceAdapter();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMockConferenceAdapter } = require("./mock-conference-adapter") as {
      createMockConferenceAdapter: () => ConferenceAdapter;
    };
    adapterInstance = createMockConferenceAdapter();
  }
  return adapterInstance!;
}

export function setConferenceAdapterForTests(adapter: ConferenceAdapter | null) {
  adapterInstance = adapter;
}
