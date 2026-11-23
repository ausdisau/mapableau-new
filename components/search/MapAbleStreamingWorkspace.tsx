"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MapAbleSearchForm } from "@/components/search/MapAbleSearchForm";
import { MapAbleSearchResults } from "@/components/search/MapAbleSearchResults";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import type { MapAbleSearchResponse } from "@/lib/search/mapable-search-core";
import {
  buildMapAbleSearchUrl,
  type SearchSelection,
} from "@/lib/search/mapable-search-ui";
import {
  initialPublicStreamView,
  readPublicSearchStreamChunk,
  reducePublicStreamView,
  type PublicStreamView,
} from "@/lib/search/mapable-stream-contract";

type Props = { initialSelection: SearchSelection };
type PreviousTurn = { query: string; answer: string };
const SUGGESTIONS = [
  "Find accessible clinics",
  "Explore step-free transport",
  "Explore inclusive jobs",
  "Find free community activities",
] as const;

const buttonClass =
  `min-h-11 rounded-xl border border-[#005B7F] px-4 py-2 text-sm font-bold text-[#005B7F] hover:bg-[#F6FBFC] ${mapableCareFocusRing}`;

/**
 * Evidence-guided streaming (not AI-generated). This is deliberately isolated
 * from MapAble's private profiles, billing, ad rankings and signed-in chat.
 */
export function MapAbleStreamingWorkspace({ initialSelection }: Props) {
  const router = useRouter();
  const id = useId();
  const [selection, setSelection] = useState(initialSelection);
  const [approved, setApproved] = useState(false);
  const [view, setView] = useState<PublicStreamView>(initialPublicStreamView);
  const [activeQuery, setActiveQuery] = useState("");
  const [refinement, setRefinement] = useState("");
  const [history, setHistory] = useState<PreviousTurn[]>([]);
  const [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => () => {
    controller.current?.abort();
    sequence.current += 1;
  }, []);

  function reset() {
    controller.current?.abort();
    sequence.current += 1;
    setHistory([]);
    setActiveQuery("");
    setRefinement("");
    setView(initialPublicStreamView());
    setNotice("Conversation cleared from this page.");
  }

  function stop() {
    controller.current?.abort();
    controller.current = null;
    sequence.current += 1;
    setView((old) => old.status === "streaming"
      ? { ...old, status: "stopped" } : old);
    setNotice("Streaming stopped. You can refine the question or search again.");
  }

  async function runPublicSearch(next: SearchSelection) {
    if (next.presentation === "web") {
      router.push(buildMapAbleSearchUrl(next));
      return;
    }
    if (next.tier === "deep") {
      setNotice("Deep Search is not active. Choose Quick · Free to search.");
      return;
    }
    if (!approved) {
      setNotice("Choose the public-search consent checkbox before sending a question.");
      return;
    }
    const q = next.query.trim();
    if (q.length < 2 || q.length > 180) {
      setNotice("Enter a question of 2–180 characters.");
      return;
    }

    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const current = ++sequence.current;
    if (activeQuery) {
      setHistory((old) => [...old, { query: activeQuery, answer: viewRef.current.answer }].slice(-4));
    }
    setActiveQuery(q);
    setRefinement("");
    setView({ ...initialPublicStreamView(), status: "streaming" });
    setNotice("Checking public search sources. You can stop this request.");
    let completed = false;

    try {
      const response = await fetch("/api/mapable-search/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        signal: request.signal,
        body: JSON.stringify({
          message: q,
          vertical: next.category,
          publicSearchApproved: true,
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(response.status === 404 ? "Streaming preview is not enabled."
          : response.status === 429 ? "Too many requests. Please retry later."
          : "Streaming Search is unavailable. Use Web search or contact MapAble.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done || request.signal.aborted || current !== sequence.current) break;
          const parsed = readPublicSearchStreamChunk(buffer + decoder.decode(value, { stream: true }));
          buffer = parsed.remainder;
          for (const event of parsed.events) {
            if (event.type === "search.completed") completed = true;
            setView((old) => reducePublicStreamView(old, event));
          }
          if (buffer.length > 64_000) throw new Error("Stream exceeded its safe size.");
        }
      } finally {
        reader.releaseLock();
      }
      if (current === sequence.current && !request.signal.aborted) {
        if (completed) setNotice("Answer ready. Review the source-labelled results.");
        else throw new Error("Stream ended before results were completed. Please retry.");
      }
    } catch (error) {
      if (request.signal.aborted || current !== sequence.current) return;
      const message = error instanceof Error ? error.message : "Streaming Search is unavailable.";
      setView((old) => ({
        ...old,
        status: "error",
        warningMessages: [message],
      }));
      setNotice(message);
    } finally {
      if (current === sequence.current) controller.current = null;
    }
  }

  const currentResponse: MapAbleSearchResponse | null =
    view.status === "idle" ? null : {
      results: view.results,
      resultCount: view.results.length,
      providerIndexEnabled: view.sourceState === "imported_provider_index",
      sourceState: view.sourceState ?? "navigation_only",
      warnings: view.warningMessages,
    };
  const resultStatus =
    view.status === "streaming" && view.results.length === 0 ? "loading"
      : view.status === "idle" ? "idle"
      : view.status === "error" ? "service_unavailable"
      : view.sourceState === "partial" ? "partial_data"
      : view.results.length === 0 ? "no_match" : "results";

  return (
    <div className="space-y-5">
      <nav aria-label="Skip within Search" className="flex flex-wrap gap-3 text-sm">
        <a href={`#${id}-chat`} className="text-[#005B7F] underline">Skip to conversation</a>
        <a href={`#${id}-results`} className="text-[#005B7F] underline">Skip to results</a>
      </nav>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
        <section id={`${id}-chat`} aria-labelledby={`${id}-heading`} className="min-w-0 space-y-5">
          <header className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-[#005B7F]">MapAble Search</p>
            <h1 id={`${id}-heading`} className="font-heading text-3xl font-bold text-[#0C1833] sm:text-4xl">
              Find what works for you.
            </h1>
            <p className="text-base text-slate-700">One search. An accessible Australia.</p>
          </header>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <MapAbleSearchForm
              initialSelection={initialSelection}
              navigateOnSubmit={false}
              onSelectionChange={setSelection}
              onSearch={(next) => void runPublicSearch(next)}
            />
          </div>

          <section aria-labelledby={`${id}-conversation-title`} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 id={`${id}-conversation-title`} className="font-heading text-xl font-bold text-[#0C1833]">
              Evidence-guided streaming conversation
            </h2>
            <p className="text-sm text-slate-700">
              This preview streams public search results and factual explanations. It does not
              use a generative AI model, read your NDIS plan or auto-load an access profile.
            </p>
            <label className="flex min-h-11 items-start gap-3 rounded-xl bg-[#F6FBFC] p-3 text-sm text-[#0C1833]">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={approved}
                onChange={(event) => {
                  setApproved(event.target.checked);
                  if (!event.target.checked) { stop(); reset(); }
                }}
              />
              <span>
                I choose to send my question to MapAble's public search server.
                Do not include diagnoses, plan numbers or identifying details.
                No AI provider is used for this streaming preview.
              </span>
            </label>

            <div aria-label="AAC-friendly search suggestions" className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" className={buttonClass}
                  onClick={() => {
                    setRefinement(suggestion);
                    setNotice("Suggestion entered. Select Search this question when ready.");
                  }}>
                  {suggestion}
                </button>
              ))}
            </div>

            {history.length > 0 ? (
              <details className="rounded-xl border border-slate-200 p-3 text-sm">
                <summary className="min-h-11 cursor-pointer font-semibold">Earlier questions (this page only)</summary>
                <ol className="mt-2 space-y-3">
                  {history.map((turn, i) => (
                    <li key={i}>
                      <p className="font-semibold">You: {turn.query}</p>
                      <p className="whitespace-pre-wrap">{turn.answer || "Search stopped before an answer."}</p>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}

            {activeQuery ? (
              <div className="space-y-2 rounded-xl bg-[#F6FBFC] p-3">
                <p className="text-sm font-bold text-[#0C1833]">You asked</p>
                <p className="break-words text-sm">{activeQuery}</p>
                <p className="text-sm font-bold text-[#0C1833]">MapAble response</p>
                <p className="whitespace-pre-wrap break-words text-sm" aria-live="off">
                  {view.answer || "Waiting for results…"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-700">
                Enter a question above or choose a suggested phrase. Nothing is sent automatically.
              </p>
            )}

            <p role="status" aria-live="polite" aria-atomic="true" className="text-sm font-medium text-[#0C1833]">
              {notice}
            </p>

            {view.sources.length > 0 ? (
              <details className="text-sm">
                <summary className="min-h-11 cursor-pointer font-bold">Sources consulted</summary>
                <ul className="list-disc space-y-1 pl-6">
                  {view.sources.map((source) => <li key={source}>{source}</li>)}
                </ul>
              </details>
            ) : null}

            <form className="space-y-2" onSubmit={(event) => {
              event.preventDefault();
              void runPublicSearch({ ...selection, presentation: "conversation", query: refinement });
            }}>
              <label className="block text-sm font-semibold" htmlFor={`${id}-refine`}>
                New question or refinement (separate search)
              </label>
              <textarea
                id={`${id}-refine`}
                className="min-h-20 w-full resize-y rounded-xl border border-slate-400 bg-white p-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#005B7F]"
                maxLength={180}
                value={refinement}
                onChange={(event) => setRefinement(event.target.value)}
                placeholder="Ask another question, or revise the whole search…"
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={view.status === "streaming"} className={buttonClass}>
                  Search this question
                </button>
                <button type="button" disabled={view.status !== "streaming"} onClick={stop} className={buttonClass}>
                  Stop streaming
                </button>
                <button type="button" disabled={!activeQuery || view.status === "streaming"}
                  onClick={() => void runPublicSearch({
                    ...selection, presentation: "conversation", query: activeQuery,
                  })} className={buttonClass}>
                  Retry last question
                </button>
                <button type="button" onClick={reset} className={buttonClass}>Clear conversation</button>
              </div>
            </form>
            <Link href="/contact" className="inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline">
              Speak to a person
            </Link>
          </section>
        </section>

        <section id={`${id}-results`} aria-label="Synchronized search results" className="min-w-0 space-y-4 lg:sticky lg:top-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-heading text-xl font-bold text-[#0C1833]">
              Results and spatial information
            </h2>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Search result view">
              <button type="button" aria-pressed="true" className="min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-bold text-white">
                List · Available
              </button>
              <button type="button" disabled title="No sourced coordinates for a 2D map"
                className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm text-slate-500">
                2D Map · Unavailable
              </button>
              <button type="button" disabled title="No verified 3D floor plans"
                className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm text-slate-500">
                3D · Unavailable
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              {view.spatialNote ?? "Spatial views require verified coordinates, routes and floor plans. No speculative pins are shown."}
            </p>
          </div>
          <div aria-busy={view.status === "streaming"}>
            <MapAbleSearchResults status={resultStatus} response={currentResponse} announceStatus={false} />
          </div>
        </section>
      </div>
    </div>
  );
}
