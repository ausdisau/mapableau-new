
import {
  careosMissionDetailSchema,
  careosMissionSummarySchema,
  confirmMissionActionRequestSchema,
  createAppointmentMissionRequestSchema,
  type CareOSMissionDetail,
  type CareOSMissionSummary,
  type ConfirmMissionActionRequest,
  type CreateAppointmentMissionRequest,
} from "@mapable/careos-contracts";
import {
  parseMobileFeatureFlags,
  type MobileFeatureFlags,
} from "@mapable/feature-flags";
import { z } from "zod";

export type ApiClientConfig = {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
  getParticipantId: () => Promise<string | null>;
  getOrganisationId: () => Promise<string | null>;
  appVersion: string;
  fetchImpl?: typeof fetch;
};

export class MapableApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "MapableApiError";
  }
}

const todayItemSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "care_shift",
    "transport_pickup",
    "appointment",
    "mission",
    "decision",
    "message",
    "document",
    "receipt",
    "continuity_alert",
    "human_help",
  ]),
  title: z.string(),
  whatChanged: z.string(),
  whyItMatters: z.string(),
  needsDecision: z.boolean(),
  whoIsWaiting: z.string().nullable(),
  whatHappensNext: z.string(),
  href: z.string().nullable(),
}).strict();

export const mobileTodaySchema = z.object({
  generatedAt: z.string().datetime(),
  items: z.array(todayItemSchema),
}).strict();

export const mobileBootstrapSchema = z.object({
  appRole: z.string(),
  organisationId: z.string().nullable(),
  participantId: z.string().nullable(),
  flags: z.record(z.string(), z.boolean()),
  minimumSupportedVersion: z.string(),
  humanHelpPhone: z.string().nullable(),
  navigationMode: z.enum(["participant", "worker", "coordinator"]),
}).strict();

export type MobileToday = z.infer<typeof mobileTodaySchema>;
export type MobileBootstrap = z.infer<typeof mobileBootstrapSchema>;
export type TodayItem = z.infer<typeof todayItemSchema>;

export function createMapableApiClient(config: ApiClientConfig) {
  const fetchImpl = config.fetchImpl ?? fetch;

  async function request<T>(
    path: string,
    init: RequestInit,
    parse: (data: unknown) => T,
  ): Promise<T> {
    const token = await config.getAccessToken();
    const participantId = await config.getParticipantId();
    const organisationId = await config.getOrganisationId();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("X-MapAble-App-Version", config.appVersion);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (participantId) headers.set("x-participant-id", participantId);
    if (organisationId) headers.set("x-organisation-id", organisationId);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetchImpl(new URL(path, config.baseUrl).toString(), {
      ...init,
      headers,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new MapableApiError(
        typeof json?.error?.message === "string"
          ? json.error.message
          : `Request failed (${res.status})`,
        res.status,
        typeof json?.error?.code === "string" ? json.error.code : undefined,
      );
    }
    return parse(json.data ?? json);
  }

  return {
    async getBootstrap(): Promise<{ bootstrap: MobileBootstrap; flags: MobileFeatureFlags }> {
      const bootstrap = await request("/api/v1/mobile/bootstrap", { method: "GET" }, (data) =>
        mobileBootstrapSchema.parse(data),
      );
      return { bootstrap, flags: parseMobileFeatureFlags(bootstrap.flags) };
    },

    getToday(): Promise<MobileToday> {
      return request("/api/v1/mobile/today", { method: "GET" }, (data) =>
        mobileTodaySchema.parse(data),
      );
    },

    listMissions(): Promise<CareOSMissionSummary[]> {
      return request("/api/v1/mobile/missions", { method: "GET" }, (data) => {
        const parsed = z.object({ missions: z.array(careosMissionSummarySchema) }).parse(data);
        return parsed.missions;
      });
    },

    getMission(id: string): Promise<CareOSMissionDetail> {
      return request(`/api/v1/mobile/missions/${encodeURIComponent(id)}`, { method: "GET" }, (data) =>
        careosMissionDetailSchema.parse(data),
      );
    },

    createAppointmentMission(
      body: CreateAppointmentMissionRequest,
    ): Promise<CareOSMissionDetail> {
      createAppointmentMissionRequestSchema.parse(body);
      return request(
        "/api/v1/mobile/missions",
        { method: "POST", body: JSON.stringify(body) },
        (data) => careosMissionDetailSchema.parse(data),
      );
    },

    confirmMissionAction(
      missionId: string,
      body: ConfirmMissionActionRequest,
    ): Promise<CareOSMissionDetail> {
      confirmMissionActionRequestSchema.parse(body);
      return request(
        `/api/v1/mobile/missions/${encodeURIComponent(missionId)}/confirmations`,
        { method: "POST", body: JSON.stringify(body) },
        (data) => careosMissionDetailSchema.parse(data),
      );
    },

    registerPushToken(input: {
      token: string;
      platform: "ios" | "android";
      idempotencyKey: string;
    }): Promise<{ registered: boolean }> {
      return request(
        "/api/v1/mobile/push-tokens",
        { method: "POST", body: JSON.stringify(input) },
        (data) => z.object({ registered: z.boolean() }).parse(data),
      );
    },

    getMinimumSupportedVersion(): Promise<{ version: string }> {
      return request(
        "/api/v1/mobile/minimum-supported-version",
        { method: "GET" },
        (data) => z.object({ version: z.string() }).parse(data),
      );
    },

    syncPull(cursor: string | null): Promise<{ cursor: string; records: unknown[] }> {
      return request(
        "/api/v1/mobile/sync/pull",
        {
          method: "POST",
          body: JSON.stringify({ cursor }),
        },
        (data) =>
          z
            .object({
              cursor: z.string(),
              records: z.array(z.unknown()),
            })
            .parse(data),
      );
    },

    syncPush(mutations: unknown[]): Promise<{ accepted: number; conflicts: unknown[] }> {
      return request(
        "/api/v1/mobile/sync/push",
        { method: "POST", body: JSON.stringify({ mutations }) },
        (data) =>
          z
            .object({
              accepted: z.number().int(),
              conflicts: z.array(z.unknown()),
            })
            .parse(data),
      );
    },
  };
}

export type MapableApiClient = ReturnType<typeof createMapableApiClient>;
