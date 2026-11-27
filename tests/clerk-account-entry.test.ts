import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as forgot } from "@/app/api/auth/forgot-password/route";
import { POST as reset } from "@/app/api/auth/reset-password/route";
import { POST as register } from "@/app/api/register/route";
import { GET as finish } from "@/app/auth/adid/finish/route";
import { startClerkRegistration } from "@/app/register/start-clerk-registration";
import {
  registrationCookie,
  registrationDestination,
  readRegistrationCookie,
} from "@/lib/auth/adid-registration";
import { isKeycloakEnabled } from "@/lib/auth/keycloak/keycloak-config";
import {
  getConfiguredOAuthProviders,
  buildOAuthProviders,
} from "@/lib/auth/oauth-providers";

const set = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ set }) }));
const cfg = {
  ADID_AUTH0_ENABLED: "true",
  ADID_AUTH0_ISSUER: "https://broker.example",
  ADID_AUTH0_CLIENT_ID: "mapable",
  ADID_AUTH0_CLIENT_SECRET: "fixture",
  ADID_AUTH0_CONNECTION: "only-clerk",
  ADID_PORTAL_ORIGIN: "https://id.example",
  KEYCLOAK_ENABLED: "true",
  AUTH0_CLIENT_ID: "legacy",
  AUTH0_CLIENT_SECRET: "legacy",
  AUTH0_ISSUER: "https://legacy.example",
  GOOGLE_CLIENT_ID: "legacy",
  GOOGLE_CLIENT_SECRET: "legacy",
};
beforeEach(() => {
  set.mockClear();
  for (const [k, v] of Object.entries(cfg)) vi.stubEnv(k, v);
});
afterEach(() => vi.unstubAllEnvs());

describe("Clerk account entry", () => {
  it("exposes the Clerk connection alone even when other providers have credentials", async () => {
    expect(getConfiguredOAuthProviders()).toEqual({
      adid: true,
      auth0: false,
      apple: false,
      microsoft: false,
      google: false,
      facebook: false,
    });
    expect(isKeycloakEnabled()).toBe(false);
    const { authOptions } =
      await import("@/app/api/auth/[...nextauth]/authOptions");
    expect(
      authOptions.providers.map((p) =>
        p.type === "oauth" ? p.options?.id : p.id,
      ),
    ).toEqual(["adid"]);
    vi.stubEnv("ADID_PORTAL_ORIGIN", "");
    expect(buildOAuthProviders()).toHaveLength(0);
  });
  it("redirects registration to Clerk and holds the invite and region on MapAble", async () => {
    const form = new FormData();
    const invite = "a".repeat(43);
    form.set("inviteToken", invite);
    form.set("jurisdiction", "NZ");
    await expect(startClerkRegistration(form)).rejects.toMatchObject({
      digest: expect.stringContaining(
        "https://id.example/sign-up?service=mapable;",
      ),
    });
    const [name, value, options] = set.mock.calls[0];
    expect(name).toBe(registrationCookie);
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(readRegistrationCookie(value)).toEqual({
      region: "NZ",
      destination: "/invite/worker/" + invite,
    });
  });
  it("returns a person to their local job or invitation and consumes the one-time navigation preference", () => {
    const request = new NextRequest("https://mapable.example/auth/adid/finish");
    request.cookies.set(
      registrationCookie,
      JSON.stringify({ region: "AU", destination: "/jobs?work=remote" }),
    );
    const response = finish(request);
    expect(response.headers.get("location")).toBe(
      "https://mapable.example/jobs?work=remote",
    );
    expect(response.cookies.get(registrationCookie)?.value).toBe("");
    expect(registrationDestination("//example.test")).toBe(
      "/register/assessment",
    );
    expect(readRegistrationCookie("invalid")).toBeNull();
  });
  it("refuses local password creation and resets before touching the account store", async () => {
    for (const handler of [register, forgot, reset]) {
      const response = await handler(
        new Request("https://mapable.example", { method: "POST" }),
      );
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ code: "USE_ADID" });
    }
  });
});
