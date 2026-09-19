"use client";

import {
  Bot,
  Check,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Code2,
  Contrast,
  LockKeyhole,
  MessageSquare,
  Mic,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Volume2,
  ZoomIn,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  MAPABLE_AGENT_STUDIO_AUTONOMY,
  MAPABLE_AGENT_STUDIO_MODEL,
} from "@/lib/ai/platform/agent-studio/contracts";

type StudioCapability = {
  key: string;
  registered: boolean;
  backend: string | null;
  authorityCeiling: string | null;
  featureFlag: string | null;
  enabled: boolean;
  killed: boolean;
  humanReviewRequired: boolean;
  participantApprovalRequired: boolean;
};

type StudioProfile = {
  capabilityId: string;
  version: string;
  registryValid: boolean;
  registryIssues: unknown[];
  supportAgent: {
    id: string;
    name: string;
    description: string;
    authorityCeiling: string;
    prohibitedActions: readonly string[];
  };
  participantAuthority: {
    id: string;
    name: string;
    description: string;
    authorityCeiling: string;
    prohibitedActions: readonly string[];
  };
  capabilities: StudioCapability[];
};

type ManagedSession = {
  id: string;
  status?: "idle" | "in_progress" | "requires_action" | "failed";
  created_at?: number;
  last_active_at?: number;
  error?: string | null;
  required_actions?: unknown[];
};

type SessionItem = Record<string, unknown>;

type Props = {
  enabled: boolean;
  openAiConfigured: boolean;
  projectConfigured: boolean;
  profile: StudioProfile;
};

const DEFAULT_NAME = "MapAble Care & Support Agent";
const DEFAULT_SPECIALIZATION =
  "Help a person express a support goal in their own words. Separate mandatory access and communication requirements from preferences. Ask only the minimum clarifying questions needed. Explain missing evidence and keep Talk to a person available.";

const AAC_PHRASES = [
  "I need help finding support.",
  "Show me what information is missing.",
  "I want to change a requirement.",
  "Please explain this in simpler language.",
  "I want to talk to a person.",
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatTimestamp(value?: number) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function collectText(value: unknown, output: string[], depth = 0) {
  if (depth > 8 || value === null || value === undefined) return;
  if (typeof value === "string") return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output, depth + 1));
    return;
  }

  if (typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    if (
      (key === "text" || key === "output_text" || key === "input_text") &&
      typeof child === "string" &&
      child.trim()
    ) {
      output.push(child.trim());
      continue;
    }
    collectText(child, output, depth + 1);
  }
}

function sessionItemView(item: SessionItem, index: number) {
  const texts: string[] = [];
  collectText(item, texts);
  const role =
    typeof item.role === "string"
      ? item.role
      : typeof item.type === "string" && item.type.includes("input")
        ? "user"
        : "agent";
  const id =
    typeof item.id === "string" ? item.id : "item-" + String(index + 1);

  return {
    id,
    role,
    type: typeof item.type === "string" ? item.type : "session item",
    text: Array.from(new Set(texts)).join("\n\n"),
  };
}

async function readJson(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : "The request could not be completed.";
    throw new Error(message);
  }

  return payload ?? {};
}

function buildConfigPreview(input: {
  name: string;
  specialization: string;
  reasoningEffort: "low" | "medium" | "high";
  verbosity: "low" | "medium" | "high";
}) {
  const escapedName = JSON.stringify(input.name);
  const specialization = input.specialization.trim()
    ? "buildMapAbleCareInstructions(" +
      JSON.stringify(input.specialization.trim()) +
      ")"
    : "buildMapAbleCareInstructions()";

  return [
    'import OpenAI from "openai";',
    "",
    "const client = new OpenAI();",
    "",
    "const agent = await client.beta.agents.create({",
    "  name: " + escapedName + ",",
    '  model: "' + MAPABLE_AGENT_STUDIO_MODEL + '",',
    "  instructions: " + specialization + ",",
    "  reasoning: {",
    '    effort: "' + input.reasoningEffort + '",',
    '    summary: "auto",',
    "  },",
    "  text: {",
    '    format: { type: "text" },',
    '    verbosity: "' + input.verbosity + '",',
    "  },",
    "  tools: [], // v0.1: no hosted consequential tools",
    "  metadata: {",
    '    mapable_capability: "care.support-agent",',
    '    mapable_authority: "A0-A3",',
    '    mapable_data: "synthetic_or_deidentified",',
    "  },",
    "});",
    "",
    "console.log(agent.id);",
  ].join("\n");
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "blocked";
}) {
  const styles = {
    neutral: "border-[#D9E5E9] bg-white text-[#52636E]",
    good: "border-[#A9DDCD] bg-[#E9F8F2] text-[#0B6B50]",
    warn: "border-[#F5D889] bg-[#FFF8DD] text-[#765000]",
    blocked: "border-[#F7B4B4] bg-[#FEF2F2] text-[#991B1B]",
  };

  return (
    <span
      className={cx(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-black",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-black uppercase tracking-[0.13em] text-[#52636E]">
      {children}
    </h3>
  );
}

function StudioField({
  children,
  label,
  hint,
}: {
  children: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#0C1833]">{label}</span>
      {hint ? (
        <span className="mt-1 block text-xs leading-5 text-[#52636E]">
          {hint}
        </span>
      ) : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function EmptySessionState() {
  return (
    <div className="flex min-h-[28rem] flex-col items-center justify-center px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E8F5F8] text-[#005B7F]">
        <MessageSquare aria-hidden="true" size={26} />
      </div>
      <h2 className="mapable-display mt-5 text-2xl font-black text-[#0C1833]">
        Start a synthetic session
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[#52636E]">
        Save a governed agent definition first, then create a managed OpenAI
        session using synthetic or de-identified prompts only.
      </p>
    </div>
  );
}

export function MapAbleAgentStudio({
  enabled,
  openAiConfigured,
  projectConfigured,
  profile,
}: Props) {
  const [tab, setTab] = useState<"setup" | "sessions">("setup");
  const [name, setName] = useState(DEFAULT_NAME);
  const [specialization, setSpecialization] = useState(DEFAULT_SPECIALIZATION);
  const [reasoningEffort, setReasoningEffort] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [verbosity, setVerbosity] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [sessions, setSessions] = useState<ManagedSession[]>([]);
  const [activeSession, setActiveSession] = useState<ManagedSession | null>(
    null,
  );
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [initialInput, setInitialInput] = useState(
    "Synthetic scenario: I need a support worker on Friday morning who understands my communication method, and I also need an accessible way to get to an appointment.",
  );
  const [composer, setComposer] = useState("");
  const [busy, setBusy] = useState<
    "idle" | "saving" | "starting" | "sending" | "refreshing"
  >("idle");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const canRun = enabled && openAiConfigured && profile.registryValid;

  useEffect(() => {
    const savedAgentId = window.localStorage.getItem(
      "mapable.agent-studio.care-support.agent-id",
    );
    if (savedAgentId) setAgentId(savedAgentId);
  }, []);

  const configPreview = useMemo(
    () =>
      buildConfigPreview({
        name,
        specialization,
        reasoningEffort,
        verbosity,
      }),
    [name, specialization, reasoningEffort, verbosity],
  );

  const messageViews = useMemo(
    () => sessionItems.map(sessionItemView),
    [sessionItems],
  );

  const refreshSession = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    setBusy((current) => (current === "idle" ? "refreshing" : current));

    try {
      const response = await fetch(
        "/api/admin/ai/agent-studio/sessions/" +
          encodeURIComponent(sessionId),
        { cache: "no-store" },
      );
      const payload = await readJson(response);
      const nextSession = payload.session as ManagedSession | undefined;
      const itemsPage = payload.items as
        | { data?: SessionItem[] }
        | undefined;

      if (nextSession) setActiveSession(nextSession);
      setSessionItems(itemsPage?.data ?? []);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to refresh session.",
      );
    } finally {
      setBusy((current) => (current === "refreshing" ? "idle" : current));
    }
  }, []);

  const loadSessions = useCallback(async () => {
    if (!agentId || !canRun) return;

    try {
      const response = await fetch(
        "/api/admin/ai/agent-studio/sessions?agentId=" +
          encodeURIComponent(agentId),
        { cache: "no-store" },
      );
      const payload = await readJson(response);
      setSessions(
        Array.isArray(payload.data)
          ? (payload.data as ManagedSession[])
          : [],
      );
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load sessions.",
      );
    }
  }, [agentId, canRun]);

  useEffect(() => {
    if (tab === "sessions") void loadSessions();
  }, [tab, loadSessions]);

  useEffect(() => {
    if (!activeSession?.id || activeSession.status !== "in_progress") return;

    const timer = window.setInterval(() => {
      void refreshSession(activeSession.id);
    }, 1600);

    return () => window.clearInterval(timer);
  }, [activeSession?.id, activeSession?.status, refreshSession]);

  async function saveDefinition() {
    if (!canRun || busy !== "idle") return;
    setBusy("saving");
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/admin/ai/agent-studio/agents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            model: MAPABLE_AGENT_STUDIO_MODEL,
            specializationInstructions: specialization,
            reasoningEffort,
            verbosity,
          }),
        },
      );
      const payload = await readJson(response);
      const agent = payload.agent as { id?: string } | undefined;

      if (!agent?.id) throw new Error("OpenAI did not return an agent ID.");

      setAgentId(agent.id);
      window.localStorage.setItem(
        "mapable.agent-studio.care-support.agent-id",
        agent.id,
      );
      setNotice(
        "Reusable agent saved. The hosted definition has zero function tools and remains inside the A0-A3 Studio boundary.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save agent.",
      );
    } finally {
      setBusy("idle");
    }
  }

  async function startSession() {
    if (!canRun || !agentId || busy !== "idle") return;
    setBusy("starting");
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/admin/ai/agent-studio/sessions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            initialInput,
            dataClassification: "synthetic_or_deidentified",
          }),
        },
      );
      const payload = await readJson(response);
      const session = payload.session as ManagedSession | undefined;

      if (!session?.id) throw new Error("OpenAI did not return a session ID.");

      setActiveSession(session);
      setTab("sessions");
      setNotice("Synthetic managed session created.");
      await loadSessions();
      await refreshSession(session.id);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to start session.",
      );
    } finally {
      setBusy("idle");
    }
  }

  async function sendMessage() {
    const message = composer.trim();
    if (
      !canRun ||
      !activeSession?.id ||
      !message ||
      busy !== "idle" ||
      activeSession.status === "in_progress"
    ) {
      return;
    }

    setBusy("sending");
    setError("");
    setComposer("");

    try {
      const response = await fetch(
        "/api/admin/ai/agent-studio/sessions/" +
          encodeURIComponent(activeSession.id),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            dataClassification: "synthetic_or_deidentified",
          }),
        },
      );
      await readJson(response);
      setActiveSession({ ...activeSession, status: "in_progress" });
      setNotice("Message accepted by the managed session.");
      window.setTimeout(() => {
        void refreshSession(activeSession.id);
      }, 700);
    } catch (cause) {
      setComposer(message);
      setError(
        cause instanceof Error ? cause.message : "Unable to send message.",
      );
    } finally {
      setBusy("idle");
    }
  }

  function resetBlueprint() {
    setName(DEFAULT_NAME);
    setSpecialization(DEFAULT_SPECIALIZATION);
    setReasoningEffort("medium");
    setVerbosity("medium");
    setNotice("MapAble v0.1 blueprint restored.");
    setError("");
  }

  async function copyConfig() {
    await navigator.clipboard.writeText(configPreview);
    setNotice("TypeScript configuration copied.");
  }

  const shell = highContrast
    ? "bg-black text-white"
    : "bg-[#F6FBFC] text-[#0C1833]";
  const panel = highContrast
    ? "border-[#F8C51C] bg-black"
    : "border-[#D9E5E9] bg-white";
  const muted = highContrast ? "text-[#FEF08A]" : "text-[#52636E]";
  const field = highContrast
    ? "border-[#F8C51C] bg-black text-white"
    : "border-[#C7D7DC] bg-white text-[#0C1833]";

  return (
    <div
      className={cx(
        "min-h-[780px] overflow-hidden rounded-3xl border shadow-sm",
        shell,
        highContrast ? "border-[#F8C51C]" : "border-[#D9E5E9]",
        largeText && "text-[1.08rem]",
      )}
    >
      <div
        className={cx(
          "flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4",
          highContrast ? "border-[#F8C51C]" : "border-[#D9E5E9] bg-white",
        )}
      >
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Link
            href="/admin/ai/agents"
            className={cx("font-black hover:underline", highContrast ? "text-[#F8C51C]" : "text-[#005B7F]")}
          >
            Agents
          </Link>
          <ChevronRight aria-hidden="true" size={16} className={muted} />
          <span className="truncate font-black">{name || "New agent"}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={profile.registryValid ? "good" : "blocked"}>
            Registry {profile.registryValid ? "pass" : "blocked"}
          </StatusPill>
          <StatusPill tone={enabled ? "good" : "warn"}>
            Studio {enabled ? "enabled" : "flag off"}
          </StatusPill>
          <StatusPill tone={openAiConfigured ? "good" : "warn"}>
            OpenAI {openAiConfigured ? "configured" : "not configured"}
          </StatusPill>
          <button
            type="button"
            aria-pressed={largeText}
            aria-label="Toggle larger text"
            onClick={() => setLargeText((value) => !value)}
            className={cx(
              "grid min-h-11 min-w-11 place-items-center rounded-xl border",
              field,
            )}
          >
            <ZoomIn aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            aria-pressed={highContrast}
            aria-label="Toggle high contrast"
            onClick={() => setHighContrast((value) => !value)}
            className={cx(
              "grid min-h-11 min-w-11 place-items-center rounded-xl border",
              field,
            )}
          >
            <Contrast aria-hidden="true" size={18} />
          </button>
        </div>
      </div>

      <div
        className={cx(
          "flex border-b px-5",
          highContrast ? "border-[#F8C51C]" : "border-[#D9E5E9] bg-white",
        )}
        role="tablist"
        aria-label="Agent Studio sections"
      >
        {(["setup", "sessions"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={cx(
              "min-h-12 border-b-2 px-1 text-sm font-black capitalize",
              item === "sessions" && "ml-5",
              tab === item
                ? highContrast
                  ? "border-[#F8C51C] text-[#F8C51C]"
                  : "border-[#005B7F] text-[#005B7F]"
                : "border-transparent " + muted,
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {(notice || error) && (
        <div className="px-5 pt-4" aria-live="polite">
          {notice ? (
            <div className="rounded-xl border border-[#A9DDCD] bg-[#E9F8F2] px-4 py-3 text-sm font-semibold text-[#0B6B50]">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-[#F7B4B4] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#991B1B]"
            >
              {error}
            </div>
          ) : null}
        </div>
      )}

      <div className="grid min-h-[700px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside
          className={cx(
            "border-b p-5 lg:border-b-0 lg:border-r",
            highContrast ? "border-[#F8C51C]" : "border-[#D9E5E9] bg-white",
          )}
        >
          {tab === "setup" ? (
            <div className="space-y-7">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={resetBlueprint}
                  className={cx(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black",
                    field,
                  )}
                >
                  <Sparkles aria-hidden="true" size={17} />
                  Blueprint
                </button>
                <button
                  type="button"
                  onClick={resetBlueprint}
                  className={cx(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black",
                    field,
                  )}
                >
                  <RotateCcw aria-hidden="true" size={17} />
                  Reset
                </button>
              </div>

              <section className="space-y-4">
                <SectionLabel>Agent definition</SectionLabel>
                <StudioField label="Name">
                  <input
                    value={name}
                    maxLength={80}
                    onChange={(event) => setName(event.target.value)}
                    className={cx(
                      "min-h-12 w-full rounded-xl border-2 px-3 outline-none focus:ring-4 focus:ring-[#F8C51C]/35",
                      field,
                    )}
                  />
                </StudioField>
                <StudioField
                  label="Specialization"
                  hint="MapAble governance instructions are appended server-side and cannot be removed here."
                >
                  <textarea
                    value={specialization}
                    maxLength={6000}
                    rows={8}
                    onChange={(event) =>
                      setSpecialization(event.target.value)
                    }
                    className={cx(
                      "w-full resize-y rounded-xl border-2 p-3 leading-6 outline-none focus:ring-4 focus:ring-[#F8C51C]/35",
                      field,
                    )}
                  />
                </StudioField>
              </section>

              <section className="space-y-4 border-t border-current/10 pt-6">
                <SectionLabel>Model</SectionLabel>
                <StudioField label="Model">
                  <select
                    value={MAPABLE_AGENT_STUDIO_MODEL}
                    disabled
                    className={cx(
                      "min-h-12 w-full rounded-xl border-2 px-3 font-semibold opacity-90",
                      field,
                    )}
                  >
                    <option>{MAPABLE_AGENT_STUDIO_MODEL}</option>
                  </select>
                </StudioField>
                <StudioField label="Reasoning effort">
                  <select
                    value={reasoningEffort}
                    onChange={(event) =>
                      setReasoningEffort(
                        event.target.value as "low" | "medium" | "high",
                      )
                    }
                    className={cx(
                      "min-h-12 w-full rounded-xl border-2 px-3 font-semibold",
                      field,
                    )}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </StudioField>
                <StudioField label="Verbosity">
                  <select
                    value={verbosity}
                    onChange={(event) =>
                      setVerbosity(
                        event.target.value as "low" | "medium" | "high",
                      )
                    }
                    className={cx(
                      "min-h-12 w-full rounded-xl border-2 px-3 font-semibold",
                      field,
                    )}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </StudioField>
                <div className="flex items-center justify-between rounded-xl bg-[#F6FBFC] px-3 py-3 text-sm text-[#0C1833]">
                  <span className="font-black">Reasoning summary</span>
                  <span>Auto</span>
                </div>
              </section>

              <section className="space-y-3 border-t border-current/10 pt-6">
                <SectionLabel>Authority</SectionLabel>
                {MAPABLE_AGENT_STUDIO_AUTONOMY.map((entry) => (
                  <div
                    key={entry.level}
                    className={cx(
                      "rounded-xl border p-3",
                      highContrast
                        ? "border-[#F8C51C]/60"
                        : "border-[#D9E5E9] bg-[#F9FCFC]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cx(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black",
                          entry.status === "allowed"
                            ? "bg-[#DDF7EE] text-[#0D5E49]"
                            : entry.status === "approval_required"
                              ? "bg-[#FFF1C4] text-[#7A4B00]"
                              : "bg-[#FEE2E2] text-[#991B1B]",
                        )}
                      >
                        {entry.level}
                      </span>
                      <div>
                        <p className="text-sm font-black">{entry.label}</p>
                        <p className={cx("mt-1 text-xs leading-5", muted)}>
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <section className="space-y-3 border-t border-current/10 pt-6">
                <SectionLabel>Communication access</SectionLabel>
                <div className={cx("rounded-xl border p-4", panel)}>
                  <div className="flex items-center gap-2 font-black">
                    <Volume2 aria-hidden="true" size={18} />
                    Text + AAC
                    <StatusPill tone="good">available</StatusPill>
                  </div>
                  <p className={cx("mt-2 text-xs leading-5", muted)}>
                    Short-turn AAC phrases are available in Sessions. Voice
                    calibration remains a prototype adapter and is not used as
                    authority evidence.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-[#C7D7DC] px-3 text-sm font-black text-[#52636E] opacity-70"
                  >
                    <Mic aria-hidden="true" size={17} />
                    Voice profile — prototype
                  </button>
                </div>
              </section>

              <div className="space-y-2 border-t border-current/10 pt-6">
                <button
                  type="button"
                  onClick={saveDefinition}
                  disabled={!canRun || busy !== "idle" || name.trim().length < 3}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#005B7F] px-4 font-black text-white hover:bg-[#004766] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/45"
                >
                  {busy === "saving" ? (
                    <RefreshCw
                      aria-hidden="true"
                      size={18}
                      className="motion-safe:animate-spin"
                    />
                  ) : (
                    <ShieldCheck aria-hidden="true" size={18} />
                  )}
                  Save agent definition
                </button>
                <button
                  type="button"
                  onClick={startSession}
                  disabled={!canRun || !agentId || busy !== "idle"}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#005B7F] bg-white px-4 font-black text-[#005B7F] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/45"
                >
                  <Play aria-hidden="true" size={18} />
                  Start synthetic session
                </button>
                {agentId ? (
                  <p className={cx("break-all text-xs leading-5", muted)}>
                    Saved agent: <span className="font-mono">{agentId}</span>
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <SectionLabel>Managed sessions</SectionLabel>
                <p className={cx("mt-2 text-sm leading-6", muted)}>
                  Sessions are OpenAI-managed workspaces. MapAble stores the
                  selected agent ID in this browser only; the LLM is not the
                  MapAble system of record.
                </p>
              </div>

              <button
                type="button"
                onClick={loadSessions}
                disabled={!agentId || !canRun}
                className={cx(
                  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black",
                  field,
                )}
              >
                <RefreshCw aria-hidden="true" size={17} />
                Refresh sessions
              </button>

              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className={cx("rounded-xl border p-4 text-sm", panel)}>
                    No managed sessions loaded.
                  </div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        setActiveSession(session);
                        void refreshSession(session.id);
                      }}
                      className={cx(
                        "w-full rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40",
                        activeSession?.id === session.id
                          ? "border-[#005B7F] bg-[#E8F5F8] text-[#0C1833]"
                          : panel,
                      )}
                    >
                      <span className="block truncate font-mono text-xs font-black">
                        {session.id}
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2 text-xs">
                        <span>{session.status ?? "unknown"}</span>
                        <span>{formatTimestamp(session.last_active_at)}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>

              <Link
                href="/admin/support"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F8C51C] px-3 text-sm font-black text-[#0C1833] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#005B7F]/30"
              >
                <UserRound aria-hidden="true" size={17} />
                Human support path
              </Link>
            </div>
          )}
        </aside>

        <main className="min-w-0">
          {tab === "setup" ? (
            <div className="space-y-6 p-5 sm:p-7">
              <section className={cx("overflow-hidden rounded-2xl border", panel)}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Code2 aria-hidden="true" size={18} />
                    <h2 className="font-black">Agent config</h2>
                  </div>
                  <button
                    type="button"
                    onClick={copyConfig}
                    className={cx(
                      "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black",
                      field,
                    )}
                  >
                    <Clipboard aria-hidden="true" size={15} />
                    Copy TypeScript
                  </button>
                </div>
                <div className="overflow-x-auto bg-[#071018] text-[#D8E7EA]">
                  <pre className="min-w-[720px] py-4 font-mono text-[13px] leading-6">
                    {configPreview.split("\n").map((line, index) => (
                      <span className="block px-4" key={String(index) + line}>
                        <span
                          aria-hidden="true"
                          className="mr-5 inline-block w-6 select-none text-right text-[#65747A]"
                        >
                          {index + 1}
                        </span>
                        <code>{line || " "}</code>
                      </span>
                    ))}
                  </pre>
                </div>
              </section>

              <section className={cx("rounded-2xl border p-5", panel)}>
                <h2 className="mapable-display text-xl font-black">
                  Get started creating a governed agent
                </h2>
                <div className="mt-5 space-y-0">
                  {[
                    [
                      "Define an agent",
                      "Choose a model, operator specialization and bounded A0-A3 autonomy.",
                    ],
                    [
                      "Keep authority in MapAble",
                      "Canonical agent manifests, capability flags, consent and kill switches remain authoritative.",
                    ],
                    [
                      "Create a managed session",
                      "Use the reusable agent ID with an environment of none and synthetic/de-identified input.",
                    ],
                    [
                      "Exchange events",
                      "Send follow-up messages through the server-side Agents API adapter.",
                    ],
                    [
                      "Review before real-world action",
                      "No hosted tool can book, pay, disclose or assign. Consequential work returns to MapAble control-plane services.",
                    ],
                  ].map(([title, body], index, all) => (
                    <div key={title} className="grid grid-cols-[24px_1fr] gap-4">
                      <div className="flex flex-col items-center">
                        <span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-[#E8F5F8] text-[#005B7F]">
                          <Check aria-hidden="true" size={14} />
                        </span>
                        {index < all.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className="min-h-12 w-px flex-1 bg-[#D9E5E9]"
                          />
                        ) : null}
                      </div>
                      <div className="pb-5">
                        <h3 className="font-black">{title}</h3>
                        <p className={cx("mt-1 text-sm leading-6", muted)}>
                          {body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <div className={cx("rounded-2xl border p-5", panel)}>
                  <div className="flex items-center gap-2">
                    <LockKeyhole
                      aria-hidden="true"
                      size={18}
                      className={highContrast ? "text-[#F8C51C]" : "text-[#005B7F]"}
                    />
                    <h2 className="font-black">MapAble authority boundary</h2>
                  </div>
                  <p className={cx("mt-3 text-sm leading-6", muted)}>
                    This Studio represents the existing{" "}
                    <span className="font-mono">{profile.supportAgent.id}</span>{" "}
                    and{" "}
                    <span className="font-mono">
                      {profile.participantAuthority.id}
                    </span>{" "}
                    roles. It does not register a ninth operational agent.
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-[#F6FBFC] p-3 text-[#0C1833]">
                      <dt className="text-xs font-black text-[#52636E]">
                        Capability
                      </dt>
                      <dd className="mt-1 font-mono font-black">
                        {profile.capabilityId}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-[#F6FBFC] p-3 text-[#0C1833]">
                      <dt className="text-xs font-black text-[#52636E]">
                        Hosted tools
                      </dt>
                      <dd className="mt-1 font-black">0</dd>
                    </div>
                  </dl>
                </div>

                <div className={cx("rounded-2xl border p-5", panel)}>
                  <div className="flex items-center gap-2">
                    <Bot
                      aria-hidden="true"
                      size={18}
                      className={highContrast ? "text-[#F8C51C]" : "text-[#005B7F]"}
                    />
                    <h2 className="font-black">Capability readiness</h2>
                  </div>
                  <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {profile.capabilities.map((capability) => (
                      <div
                        key={capability.key}
                        className={cx(
                          "rounded-xl border p-3",
                          highContrast
                            ? "border-[#F8C51C]/50"
                            : "border-[#D9E5E9] bg-[#F9FCFC]",
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="font-mono text-xs font-black">
                            {capability.key}
                          </span>
                          <StatusPill
                            tone={
                              capability.killed
                                ? "blocked"
                                : capability.enabled
                                  ? "good"
                                  : "warn"
                            }
                          >
                            {capability.killed
                              ? "killed"
                              : capability.enabled
                                ? "enabled"
                                : "flag off"}
                          </StatusPill>
                        </div>
                        <p className={cx("mt-2 text-xs", muted)}>
                          {capability.backend ?? "unregistered"} ·{" "}
                          {capability.authorityCeiling ?? "no authority"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {!projectConfigured ? (
                <div className="flex gap-3 rounded-2xl border border-[#F5D889] bg-[#FFF8DD] p-4 text-sm leading-6 text-[#765000]">
                  <CircleAlert
                    aria-hidden="true"
                    size={20}
                    className="mt-0.5 shrink-0"
                  />
                  <p>
                    <strong>OPENAI_PROJECT_ID is not configured.</strong> The
                    API can still use the project associated with the server
                    key, but set the explicit MapAble project ID before a
                    controlled preview.
                  </p>
                </div>
              ) : null}
            </div>
          ) : activeSession ? (
            <div className="flex min-h-[700px] flex-col">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 px-5 py-4">
                <div>
                  <p className="font-mono text-xs font-black">
                    {activeSession.id}
                  </p>
                  <p className={cx("mt-1 text-xs", muted)}>
                    Last active: {formatTimestamp(activeSession.last_active_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill
                    tone={
                      activeSession.status === "failed"
                        ? "blocked"
                        : activeSession.status === "requires_action"
                          ? "warn"
                          : activeSession.status === "idle"
                            ? "good"
                            : "neutral"
                    }
                  >
                    {activeSession.status ?? "unknown"}
                  </StatusPill>
                  <button
                    type="button"
                    onClick={() => void refreshSession(activeSession.id)}
                    className={cx(
                      "grid min-h-10 min-w-10 place-items-center rounded-lg border",
                      field,
                    )}
                    aria-label="Refresh active session"
                  >
                    <RefreshCw
                      aria-hidden="true"
                      size={16}
                      className={cx(
                        busy === "refreshing" && "motion-safe:animate-spin",
                      )}
                    />
                  </button>
                </div>
              </header>

              {activeSession.status === "requires_action" ? (
                <div className="m-5 rounded-2xl border border-[#F5D889] bg-[#FFF8DD] p-4 text-sm leading-6 text-[#765000]">
                  <strong>Session requires an action.</strong> The v0.1 Studio
                  has no registered hosted function tools, so it will not
                  execute the requested action. Review this session manually.
                </div>
              ) : null}

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {messageViews.length === 0 ? (
                  <p className={cx("text-sm", muted)}>
                    No session items are available yet.
                  </p>
                ) : (
                  messageViews.map((item) => {
                    const userMessage = item.role === "user";
                    return (
                      <article
                        key={item.id}
                        className={cx(
                          "max-w-3xl rounded-2xl border p-4",
                          userMessage
                            ? "ml-auto border-[#B4DCE5] bg-[#E8F5F8] text-[#0C1833]"
                            : highContrast
                              ? "border-[#F8C51C] bg-black"
                              : "border-[#D9E5E9] bg-white",
                        )}
                      >
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em]">
                          {userMessage ? (
                            <UserRound aria-hidden="true" size={15} />
                          ) : (
                            <Bot aria-hidden="true" size={15} />
                          )}
                          {userMessage ? "Studio operator" : "MapAble agent"}
                        </div>
                        {item.text ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                            {item.text}
                          </p>
                        ) : (
                          <p className={cx("mt-3 text-xs", muted)}>
                            {item.type}
                          </p>
                        )}
                      </article>
                    );
                  })
                )}
              </div>

              <div
                className={cx(
                  "border-t p-4",
                  highContrast ? "border-[#F8C51C]" : "border-[#D9E5E9] bg-white",
                )}
              >
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {AAC_PHRASES.map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => setComposer(phrase)}
                      className={cx(
                        "min-h-11 shrink-0 rounded-xl border px-3 text-sm font-black",
                        field,
                      )}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>

                <div className="flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Session message</span>
                    <textarea
                      value={composer}
                      rows={3}
                      maxLength={4000}
                      onChange={(event) => setComposer(event.target.value)}
                      placeholder="Use synthetic or de-identified input only…"
                      className={cx(
                        "w-full resize-none rounded-2xl border-2 p-3 leading-6 outline-none focus:ring-4 focus:ring-[#F8C51C]/35",
                        field,
                      )}
                    />
                  </label>
                  <button
                    type="button"
                    disabled
                    aria-label="Voice input is not connected in v0.1"
                    title="Voice adapter prototype only"
                    className={cx(
                      "grid min-h-12 min-w-12 place-items-center rounded-xl border opacity-50",
                      field,
                    )}
                  >
                    <Mic aria-hidden="true" size={19} />
                  </button>
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={
                      !composer.trim() ||
                      busy !== "idle" ||
                      activeSession.status === "in_progress"
                    }
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#005B7F] px-5 font-black text-white disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/45"
                  >
                    Send
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className={muted}>
                    Synthetic/de-identified evaluation only · no production
                    participant data
                  </span>
                  <Link
                    href="/admin/support"
                    className={cx(
                      "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-black",
                      highContrast
                        ? "bg-[#F8C51C] text-black"
                        : "bg-[#FFF1C4] text-[#7A4B00]",
                    )}
                  >
                    <UserRound aria-hidden="true" size={15} />
                    Talk to a person
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <EmptySessionState />
          )}
        </main>
      </div>
    </div>
  );
}
