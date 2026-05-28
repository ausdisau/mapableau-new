"use client";

import { FormEvent, useState } from "react";

import { ConfirmationGatePanel } from "@/components/copilot/ConfirmationGate";
import { NeedsAssessmentSummary } from "@/components/participant-needs/NeedsAssessmentSummary";
import { NeedsAssessmentTimeline } from "@/components/participant-needs/NeedsAssessmentTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  NeedsAssessmentResult,
  NeedsAssessmentStreamEvent,
} from "@/lib/participant-needs/types";

type Props = {
  participantId: string;
  initialQuery?: string;
};

type StreamState = {
  events: NeedsAssessmentStreamEvent[];
  result: NeedsAssessmentResult | null;
};

export function NeedsAssessmentClient({
  participantId,
  initialQuery = "",
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<StreamState>({ events: [], result: null });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isStreaming) return;

    setIsStreaming(true);
    setError(null);
    setState({ events: [], result: null });

    try {
      const response = await fetch(
        `/api/prms/participants/${encodeURIComponent(participantId)}/needs/assess/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() || undefined }),
        },
      );

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to start needs assessment.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chunk = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunk += decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        chunk = lines.pop() ?? "";

        for (const line of lines) {
          processStreamLine(line);
        }
      }

      if (chunk) {
        processStreamLine(chunk);
      }
    } catch (streamError) {
      setError(
        streamError instanceof Error
          ? streamError.message
          : "Unable to complete needs assessment.",
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function processStreamLine(line: string) {
    if (!line.startsWith("data: ")) return;
    const parsed = JSON.parse(line.slice(6)) as {
      stage?: string;
      message?: string;
      summary?: string;
      snapshot?: NeedsAssessmentResult["snapshot"];
      recommendations?: NeedsAssessmentResult["recommendations"];
      draftRecords?: NeedsAssessmentResult["draftRecords"];
      error?: string;
    };

    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    if (parsed.snapshot && parsed.participantId) {
      setState((previous) => ({
        ...previous,
        result: parsed as NeedsAssessmentResult,
      }));
      return;
    }

    if (parsed.stage && typeof parsed.message === "string") {
      const message = parsed.message;
      setState((previous) => ({
        ...previous,
        events: [
          ...previous.events,
          {
            stage: parsed.stage as NeedsAssessmentStreamEvent["stage"],
            message,
          },
        ],
      }));
    }
  }

  return (
    <section className="container mx-auto space-y-6 px-4 py-8">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Participant needs assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium" htmlFor="needs-query">
              What would you like help understanding?
            </label>
            <textarea
              id="needs-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-24 w-full rounded-lg border bg-background p-3 text-sm"
              placeholder="Example: I need support at home and transport to appointments — what am I missing in my profile?"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="default"
                size="default"
                loading={isStreaming}
              >
                Start assessment
              </Button>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Live updates stream as your profile is analysed.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-base">Assessment progress</CardTitle>
          </CardHeader>
          <CardContent>
            <NeedsAssessmentTimeline events={state.events} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {state.result ? (
            <>
              <NeedsAssessmentSummary result={state.result} />
              {state.result.draftRecords.length > 0 ? (
                <ConfirmationGatePanel
                  gates={[
                    {
                      type: "PARTICIPANT_CONFIRMATION",
                      title: "Confirm needs assessment summary",
                      explanation:
                        "Saving stores a summary in your participant record. Nothing is shared with providers until you choose to.",
                    },
                  ]}
                  draftRecords={state.result.draftRecords}
                  participantId={participantId}
                />
              ) : null}
            </>
          ) : (
            <Card variant="default">
              <CardContent className="py-8 text-sm text-muted-foreground">
                Run an assessment to see domain summary, gaps, and recommendations.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
