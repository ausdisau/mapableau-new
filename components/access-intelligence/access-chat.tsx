"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import React, { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { agentAccessPlanSchema, type AgentAccessPlan } from "@/lib/access-intelligence/schemas";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

import { AccessPlanCard } from "./access-plan-card";
import { ApprovalCard } from "./approval-card";
import { EvidenceDrawer, LiveIncidentBanner, UnknownsPanel } from "./evidence-list";
import { StarterPrompts } from "./starter-prompts";
import { VisitPlanPrintView } from "./visit-plan-print-view";

type PassportOption = { id: string; name: string; isDefault?: boolean };

function extractPlanFromMessages(messages: Array<{ parts?: unknown[] }>): AgentAccessPlan | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const parts = messages[i]?.parts ?? [];
    for (const part of parts) {
      if (!part || typeof part !== "object") continue;
      const p = part as { type?: string; output?: unknown; state?: string };
      if (p.type === "tool-createVisitPlan" && p.output && typeof p.output === "object") {
        const decision = (p.output as { accessDecision?: unknown }).accessDecision;
        const route = (p.output as { route?: unknown }).route;
        const placeId = (p.output as { placeId?: string }).placeId ?? null;
        const destination = (p.output as { destination?: string }).destination ?? null;
        if (decision && typeof decision === "object") {
          const d = decision as Record<string, unknown>;
          const candidate = {
            placeId,
            placeName: null,
            destination,
            visitAt: (p.output as { visitAt?: string | null }).visitAt ?? null,
            status: d.status ?? null,
            baselineScore: d.baselineScore ?? null,
            personalFit: d.personalFit ?? null,
            evidenceConfidence: d.evidenceConfidence ?? null,
            liveReliability: d.liveReliability ?? null,
            summary: Array.isArray(d.blockers) && (d.blockers as string[]).length
              ? `Blocked. ${(d.blockers as string[])[0]}`
              : Array.isArray(d.unknowns) && (d.unknowns as string[]).length
                ? `Information incomplete. ${(d.unknowns as string[])[0]}`
                : Array.isArray(d.conditions) && (d.conditions as string[]).length
                  ? `Suitable with conditions.`
                  : "Suitable.",
            blockers: (d.blockers as string[]) ?? [],
            conditions: (d.conditions as string[]) ?? [],
            unknowns: (d.unknowns as string[]) ?? [],
            confirmedFeatures: Array.isArray(d.matchedRequirements)
              ? (d.matchedRequirements as Array<{ outcome: string; explanation: string }>)
                  .filter((m) => m.outcome === "matched")
                  .map((m) => m.explanation)
              : [],
            recommendedRoute: route ?? null,
            alternatives: (d.alternatives as string[]) ?? [],
            actions: [],
            evidenceIds: (d.evidenceIds as string[]) ?? [],
            lastCheckedAt:
              (d.generatedAt as string) ?? new Date().toISOString(),
          };
          const parsed = agentAccessPlanSchema.safeParse(candidate);
          if (parsed.success) return parsed.data;
        }
      }
      if (
        (p.type === "tool-calculatePersonalFit" || p.type === "tool-buildAccessibleRoute") &&
        p.output
      ) {
        // Continue — prefer visit plan tool
      }
    }
  }
  return null;
}

function emptyPlan(): AgentAccessPlan {
  return {
    placeId: null,
    placeName: null,
    destination: null,
    visitAt: null,
    status: null,
    baselineScore: null,
    personalFit: null,
    evidenceConfidence: null,
    liveReliability: null,
    summary: "",
    blockers: [],
    conditions: [],
    unknowns: [],
    confirmedFeatures: [],
    recommendedRoute: null,
    alternatives: [],
    actions: [],
    evidenceIds: [],
    lastCheckedAt: new Date().toISOString(),
  };
}

export function AccessChat({
  passports,
  selectedPassportId,
  onPassportChange,
}: {
  passports: PassportOption[];
  selectedPassportId: string;
  onPassportChange: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [providerError, setProviderError] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/access-intelligence/chat",
        body: { passportId: selectedPassportId },
      }),
    [selectedPassportId],
  );

  const {
    messages,
    sendMessage,
    status,
    addToolApprovalResponse,
    error,
  } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (err) => {
      setProviderError(
        err.message ||
          "Chat is unavailable. You can still edit your passport and review demo places.",
      );
    },
  });

  const busy = status === "streaming" || status === "submitted";
  const plan = extractPlanFromMessages(messages) ?? emptyPlan();
  const liveBanner =
    messages
      .flatMap((m) => m.parts ?? [])
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          (part as { type?: string }).type === "tool-getLiveAccessStatus"
        ) {
          const output = (part as { output?: { incidents?: Array<{ description: string; status: string }> } })
            .output;
          const active = output?.incidents?.filter((i) => i.status === "active") ?? [];
          return active[0]?.description ?? null;
        }
        return null;
      })
      .find(Boolean) ?? null;

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setProviderError(null);
    setInput("");
    await sendMessage({ text: trimmed });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[16rem] flex-1 text-sm font-semibold text-slate-800">
            Selected Access Passport
            <select
              className={`mt-1 w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm ${mapableCareFocusRing}`}
              value={selectedPassportId}
              onChange={(e) => onPassportChange(e.target.value)}
            >
              {passports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </label>
          <a
            href="/access-intelligence/passport"
            className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
          >
            Edit passports
          </a>
        </div>

        <StarterPrompts disabled={busy} onSelect={(p) => void submit(p)} />

        <LiveIncidentBanner message={liveBanner} />

        <div
          className="min-h-[16rem] rounded-2xl border border-slate-200 bg-white p-4"
          aria-live="polite"
          aria-relevant="additions"
        >
          <h2 className="text-lg font-black text-[#0C1833]">Conversation</h2>
          {providerError || error ? (
            <p className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
              {providerError || error?.message}
            </p>
          ) : null}
          <ul className="mt-3 space-y-3" aria-label="Chat messages">
            {messages.map((message) => (
              <li key={message.id} className="text-sm">
                <p className="font-black text-slate-500">
                  {message.role === "user" ? "You" : "Access Intelligence"}
                </p>
                <div className="mt-1 space-y-2 text-slate-800">
                  {message.parts?.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <p key={`${message.id}-t-${index}`} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      );
                    }
                    if (
                      part.type.startsWith("tool-") &&
                      "state" in part &&
                      part.state === "approval-requested" &&
                      "approval" in part
                    ) {
                      const approval = (
                        part as {
                          approval: { id: string };
                          input?: Record<string, unknown>;
                          type: string;
                        }
                      ).approval;
                      const input = (
                        part as { input?: Record<string, unknown> }
                      ).input;
                      const toolName = part.type.replace("tool-", "");
                      return (
                        <ApprovalCard
                          key={`${message.id}-a-${index}`}
                          title={`Approve ${toolName.replaceAll(/([A-Z])/g, " $1").trim()}?`}
                          recipient={String(input?.recipient ?? "Venue / community")}
                          purpose={String(input?.purpose ?? "Access planning action")}
                          fieldsOrQuestions={
                            Array.isArray(input?.questions)
                              ? (input?.questions as string[])
                              : Array.isArray(input?.fieldsShared)
                                ? (input?.fieldsShared as string[])
                                : [String(input?.description ?? "See details above")]
                          }
                          durationLabel={
                            input?.durationHours
                              ? `${input.durationHours} hours`
                              : undefined
                          }
                          onApprove={() =>
                            addToolApprovalResponse({
                              id: approval.id,
                              approved: true,
                            })
                          }
                          onCancel={() =>
                            addToolApprovalResponse({
                              id: approval.id,
                              approved: false,
                              reason: "User cancelled",
                            })
                          }
                        />
                      );
                    }
                    if (part.type.startsWith("tool-") && "state" in part) {
                      return (
                        <p
                          key={`${message.id}-tool-${index}`}
                          className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                        >
                          Tool: {part.type.replace("tool-", "")} — {String(part.state)}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </li>
            ))}
          </ul>
          {busy ? (
            <p className="mt-3 text-sm font-semibold text-[#005B7F]" role="status">
              Checking access evidence…
            </p>
          ) : null}
        </div>

        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
        >
          <label className="sr-only" htmlFor="access-intelligence-input">
            Ask an access question
          </label>
          <input
            id="access-intelligence-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            placeholder="Ask about a place, entrance, lift, or visit plan"
            className={`min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm ${mapableCareFocusRing}`}
          />
          <Button variant="default" size="default" type="submit" disabled={busy || !input.trim()}>
            Send
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <AccessPlanCard
          plan={plan}
          onPrint={() => window.print()}
          onRequestVerification={
            plan.unknowns.length > 0
              ? () =>
                  void submit(
                    "Please draft a venue verification request for the unresolved questions and wait for my approval before sending.",
                  )
              : undefined
          }
        />
        <UnknownsPanel unknowns={plan.unknowns} />
        <EvidenceDrawer
          items={plan.evidenceIds.map((id) => ({
            id,
            title: id,
            capturedAt: plan.lastCheckedAt,
            sourceName: "Retrieved via tools",
            sourceType: "system_feed",
            status: "provisional",
          }))}
        />
        <VisitPlanPrintView plan={plan} />
      </div>
    </div>
  );
}
