"use client";

import { FormEvent, useMemo, useState } from "react";

import { WorkerCandidateCard } from "@/components/worker-search/WorkerCandidateCard";
import { StreamTimeline } from "@/components/worker-search/StreamTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type WorkerMarketplaceCandidate,
  type WorkerSearchFilters,
  type WorkerSearchStreamEvent,
} from "@/lib/search/worker-search-types";

type StreamState = {
  events: WorkerSearchStreamEvent[];
  candidates: WorkerMarketplaceCandidate[];
};

type Props = {
  participantId?: string;
  initialQuery?: string;
  initialFilters?: WorkerSearchFilters;
};

export function WorkerSearchClient({
  participantId,
  initialQuery = "",
  initialFilters,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<StreamState>({ events: [], candidates: [] });

  const grouped = useMemo(() => {
    const workers = state.candidates.filter((candidate) => candidate.kind === "worker");
    const providers = state.candidates.filter(
      (candidate) => candidate.kind === "provider",
    );
    return { workers, providers };
  }, [state.candidates]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isStreaming) return;

    setIsStreaming(true);
    setError(null);
    setState({ events: [], candidates: [] });

    try {
      const response = await fetch("/api/search/workers/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          participantId,
          filters: initialFilters,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to start worker search stream.");
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
          : "Unable to complete worker search stream.",
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function processStreamLine(line: string) {
    if (!line.startsWith("data: ")) return;
    const data = line.slice(6);
    const parsed = JSON.parse(data) as {
      stage?: string;
      message?: string;
      candidates?: WorkerMarketplaceCandidate[];
      error?: string;
    };

    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    if (Array.isArray(parsed.candidates)) {
      setState((previous) => ({
        ...previous,
        candidates: parsed.candidates ?? [],
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
            stage: parsed.stage as WorkerSearchStreamEvent["stage"],
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
          <CardTitle>Worker Search with Live Matching</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium" htmlFor="worker-search-query">
              Describe your support need
            </label>
            <textarea
              id="worker-search-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-24 w-full rounded-lg border bg-background p-3 text-sm"
              placeholder="Example: I need a verified support worker for personal care in Parramatta who speaks Arabic."
            />
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="default"
                size="default"
                loading={isStreaming}
              >
                Start matching
              </Button>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Progress updates stream as candidates are found and ranked.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-base">Matching progress</CardTitle>
          </CardHeader>
          <CardContent>
            <StreamTimeline events={state.events} />
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-base">Ranked results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ResultSection title="Workers" candidates={grouped.workers} />
            <ResultSection title="Providers and agencies" candidates={grouped.providers} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ResultSection({
  title,
  candidates,
}: {
  title: string;
  candidates: WorkerMarketplaceCandidate[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {candidates.length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          No matches yet.
        </p>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <WorkerCandidateCard
              key={`${candidate.kind}-${candidate.id}`}
              candidate={candidate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
