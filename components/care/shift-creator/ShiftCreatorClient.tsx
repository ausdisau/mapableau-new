"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";

import { ShiftCreatorTimeline } from "@/components/care/shift-creator/ShiftCreatorTimeline";
import { ShiftDraftCard } from "@/components/care/shift-creator/ShiftDraftCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ShiftCreatorStreamEvent,
  ShiftCreatorStreamResult,
} from "@/lib/care/shift-creator/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type StreamState = {
  events: ShiftCreatorStreamEvent[];
  result: ShiftCreatorStreamResult | null;
};

type Props = {
  careBookingId?: string;
  initialQuery?: string;
};

export function ShiftCreatorClient({
  careBookingId,
  initialQuery = "",
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<StreamState>({ events: [], result: null });
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const processStreamLine = useCallback((line: string) => {
    if (!line.startsWith("data: ")) return;
    try {
      const parsed = JSON.parse(line.slice(6)) as {
        stage?: string;
        message?: string;
        draft?: ShiftCreatorStreamResult["draft"];
        error?: string;
        warnings?: string[];
      };

      if (parsed.error) {
        setError(parsed.error);
        return;
      }

      if (parsed.draft && parsed.warnings !== undefined) {
        const result = parsed as ShiftCreatorStreamResult;
        setState((prev) => ({ ...prev, result }));
        if (result.draft.workerProfileId) {
          setSelectedWorkerId(result.draft.workerProfileId);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: result.draft.bookingTitle
              ? `Draft ready for ${result.draft.bookingTitle}. Review and confirm below.`
              : "I need a bit more detail to finish the shift plan.",
          },
        ]);
        return;
      }

      if (parsed.stage && typeof parsed.message === "string") {
        setState((prev) => ({
          ...prev,
          events: [
            ...prev.events,
            {
              stage: parsed.stage as ShiftCreatorStreamEvent["stage"],
              message: parsed.message as string,
            },
          ],
        }));
      }
    } catch {
      // ignore malformed chunks
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isStreaming) return;

    setIsStreaming(true);
    setError(null);
    setConfirmMessage(null);
    setConfirmError(null);
    setState({ events: [], result: null });
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: trimmed },
    ]);

    try {
      const response = await fetch("/api/care/shifts/create/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          careBookingId,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to start shift planning stream.");
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
      if (chunk) processStreamLine(chunk);
    } catch (streamError) {
      const message =
        streamError instanceof Error
          ? streamError.message
          : "Unable to complete shift planning.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        { id: `assistant-err-${Date.now()}`, role: "assistant", text: message },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleConfirm() {
    const draft = state.result?.draft;
    const workerProfileId = selectedWorkerId || draft?.workerProfileId;
    if (!draft?.careBookingId || !workerProfileId) return;

    setConfirming(true);
    setConfirmError(null);
    setConfirmMessage(null);

    try {
      const res = await fetch(
        `/api/care/bookings/${draft.careBookingId}/assign-worker`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerProfileId,
            startAt: draft.startAt,
            endAt: draft.endAt,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setConfirmError(data.error ?? "Assignment failed.");
        return;
      }
      setConfirmMessage("Worker assigned and shift created.");
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-ok-${Date.now()}`,
          role: "assistant",
          text: "Shift confirmed — worker assigned successfully.",
        },
      ]);
    } catch {
      setConfirmError("Could not assign worker. Try again.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <section className="container mx-auto space-y-6 px-4 py-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Shift creator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe the shift in plain language. Updates stream as we resolve the
          booking, worker, and schedule. Nothing is saved until you confirm.
        </p>
        {careBookingId ? (
          <p className="mt-2 text-sm">
            <Link
              href={`/provider/care/bookings/${careBookingId}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              Back to booking
            </Link>
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="max-h-64 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                {messages.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    Example: Assign Sam to the medical appointment booking Tuesday 9am
                    to 1pm at Demo Medical Centre.
                  </li>
                ) : (
                  messages.map((msg) => (
                    <li
                      key={msg.id}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "ml-8 bg-primary text-primary-foreground"
                          : "mr-8 border bg-card"
                      }`}
                    >
                      {msg.text}
                    </li>
                  ))
                )}
              </ul>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium" htmlFor="shift-query">
                  Your message
                </label>
                <textarea
                  id="shift-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-24 w-full rounded-lg border bg-background p-3 text-sm"
                  placeholder="Schedule a care shift for…"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="default" loading={isStreaming}>
                    Plan shift
                  </Button>
                  {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-base">Planning progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ShiftCreatorTimeline events={state.events} />
            </CardContent>
          </Card>
        </div>

        <ShiftDraftCard
          result={state.result}
          selectedWorkerId={selectedWorkerId}
          onWorkerChange={setSelectedWorkerId}
          onConfirm={() => void handleConfirm()}
          confirming={confirming}
          confirmMessage={confirmMessage}
          confirmError={confirmError}
        />
      </div>
    </section>
  );
}
