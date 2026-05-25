import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { beamsUserInterest } from "@/lib/notifications/beams-interest";
import { isAgentMailConfigured } from "@/lib/notifications/providers/agentmail-email";
import { isPusherBeamsConfigured } from "@/lib/notifications/providers/pusher-beams";
import { isTwilioSmsConfigured } from "@/lib/notifications/providers/twilio-sms";
import { startConferenceSchema } from "@/lib/validation/conference";

describe("beamsUserInterest", () => {
  it("namespaces user id for device interests", () => {
    expect(beamsUserInterest("user_abc")).toBe("mapable-user-user_abc");
  });
});

describe("notification provider configuration", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("detects AgentMail when keys present", () => {
    delete process.env.AGENTMAIL_API_KEY;
    delete process.env.AGENTMAIL_INBOX_ID;
    expect(isAgentMailConfigured()).toBe(false);
    process.env.AGENTMAIL_API_KEY = "key";
    process.env.AGENTMAIL_INBOX_ID = "inbox";
    expect(isAgentMailConfigured()).toBe(true);
  });

  it("detects Twilio when keys present", () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_SMS_FROM;
    expect(isTwilioSmsConfigured()).toBe(false);
    process.env.TWILIO_ACCOUNT_SID = "ACxxx";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_SMS_FROM = "+61400000000";
    expect(isTwilioSmsConfigured()).toBe(true);
  });

  it("detects Pusher Beams when keys present", () => {
    delete process.env.PUSHER_BEAMS_INSTANCE_ID;
    delete process.env.PUSHER_BEAMS_SECRET_KEY;
    expect(isPusherBeamsConfigured()).toBe(false);
    process.env.PUSHER_BEAMS_INSTANCE_ID = "inst";
    process.env.PUSHER_BEAMS_SECRET_KEY = "secret";
    expect(isPusherBeamsConfigured()).toBe(true);
  });
});

describe("service worker file", () => {
  it("includes Pusher Beams importScripts", async () => {
    const fs = await import("node:fs/promises");
    const sw = await fs.readFile("public/service-worker.js", "utf8");
    expect(sw).toContain('importScripts("https://js.pusher.com/beams/service-worker.js")');
  });
});

describe("conference validation unchanged", () => {
  it("still validates conference modes", () => {
    expect(startConferenceSchema.safeParse({ mode: "audio" }).success).toBe(true);
  });
});
