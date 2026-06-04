"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useId, useRef, useState } from "react";

import { ConfirmationGatePanel } from "@/components/copilot/ConfirmationGate";
import { CopilotActionCards } from "@/components/copilot/CopilotActionCards";
import { CopilotWarnings } from "@/components/copilot/CopilotWarnings";
import { DraftRecordCards } from "@/components/copilot/DraftRecordCards";
import { PlainLanguageSummary } from "@/components/copilot/PlainLanguageSummary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/app/lib/utils";
import { intentLabel } from "@/lib/copilot/intentRouter";
import type { CopilotAskResponse } from "@/lib/copilot/types";
import type { FinderInterpretationData } from "@/types/provider-finder-chat";

type SessionFields = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
};

type Props = {
  id?: string;
  session: SessionFields;
  onInterpretation: (data: FinderInterpretationData) => void;
  onShowResults?: () => void;
  initialProviderName?: string;
  className?: string;
};

const STARTER_PROMPTS = [
  "Support worker near St Ives",
  "Wheelchair accessible transport tomorrow",
  "OT assessment with NDIS registration in Parramatta",
];

export function ProviderFinderAskPanel({
  id = "ask-panel",
  session,
  onInterpretation,
  onShowResults,
  initialProviderName,
  className,
}: Props) {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const queryId = useId();
  const responseId = useId();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<CopilotAskResponse | null>(null);
  const sessionRef = useRef(session);

  sessionRef.current = session;

  const applyFinderFromResponse = useCallback(
    (data: CopilotAskResponse) => {
      if (!data.finder) return;
      onInterpretation({
        interpretation: data.finder.interpretation,
        applied: data.finder.applied,
      });
    },
    [onInterpretation],
  );

  const ask = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: trimmed,
          mode: isSignedIn ? "NDIS" : "All",
          context: "provider_finder",
          session: sessionRef.current,
          sessionId: `finder-${Date.now()}`,
          providerName: initialProviderName || sessionRef.current.providerName,
        }),
      });
      const data = (await res.json()) as CopilotAskResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        setResponse(null);
        return;
      }
      setResponse(data);
      applyFinderFromResponse(data);
    } catch {
      setError("Could not reach MapAble. Check your connection and try again.");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [input, loading, isSignedIn, initialProviderName, applyFinderFromResponse]);

  const showResults = () => {
    if (response) applyFinderFromResponse(response);
    onShowResults?.();
  };

  const hasFinder = Boolean(response?.finder);

  return (
    <Card
      id={id}
      variant="outlined"
      className={cn("flex flex-col overflow-hidden", className)}
    >
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="font-heading text-base font-semibold">Ask MapAble</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Describe what you need in plain language. I will suggest search filters
          for the provider directory. Listings are not MapAble-verified NDIS
          registration.
        </p>
        {initialProviderName ? (
          <p className="mt-2 text-xs font-medium text-foreground" role="status">
            Asking about: {initialProviderName}
          </p>
        ) : null}
        {!isSignedIn ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <Link href="/login" className="underline focus-visible:ring-2">
              Sign in
            </Link>{" "}
            to draft care, transport, or plan requests from your participant
            record.
          </p>
        ) : null}
      </div>

      <div className="space-y-3 px-4 py-3">
        <label className="sr-only" htmlFor={queryId}>
          Ask MapAble about providers
        </label>
        <textarea
          id={queryId}
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={
            initialProviderName
              ? `What would you like to know about ${initialProviderName}?`
              : "e.g. Auslan support worker in Newcastle"
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
        />

        {response === null ? (
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            disabled={!input.trim()}
            onClick={() => void ask()}
          >
            Ask
          </Button>
          {hasFinder && onShowResults ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={loading}
              onClick={showResults}
            >
              Show results
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {response ? (
        <div
          id={responseId}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="space-y-4 border-t border-border/60 px-4 py-4"
        >
          <PlainLanguageSummary
            summary={response.summary}
            answer={response.answer}
            intentLabel={intentLabel(response.intent)}
          />
          <CopilotWarnings warnings={response.warnings} />
          <CopilotActionCards
            actions={response.actions}
            blockedActions={response.blockedActions}
          />
          {isSignedIn && response.draftRecords.length > 0 ? (
            <>
              <DraftRecordCards records={response.draftRecords} />
              <ConfirmationGatePanel
                gates={response.requiredConfirmations}
                draftRecords={response.draftRecords}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
