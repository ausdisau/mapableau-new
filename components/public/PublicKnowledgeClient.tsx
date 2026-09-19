"use client";

import { Pause, Play, Search, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PublicKnowledgeAnswer = {
  answer: string;
  sources: Array<{ key: string; reason: string }>;
  uncertainty: string[];
  speechToken?: string;
};

export function PublicKnowledgeClient({
  enabled,
  ttsEnabled,
  initialQuestion = "",
}: {
  enabled: boolean;
  ttsEnabled: boolean;
  initialQuestion?: string;
}) {
  const [question, setQuestion] = useState(initialQuestion.slice(0, 1200));
  const [result, setResult] = useState<PublicKnowledgeAnswer | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!enabled || question.trim().length < 3) return;

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/public/knowledge/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const payload = (await response.json()) as PublicKnowledgeAnswer & {
        error?: string;
      };

      if (!response.ok) throw new Error(payload.error || "Question failed");
      setResult(payload);
      setStatus("idle");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Question failed");
    }
  }

  async function readAloud() {
    if (!result?.answer || !result.speechToken || !ttsEnabled) return;

    if (audioState === "playing") {
      audioRef.current?.pause();
      setAudioState("paused");
      return;
    }

    if (audioState === "paused" && audioRef.current) {
      await audioRef.current.play();
      setAudioState("playing");
      return;
    }

    setAudioState("loading");
    try {
      const response = await fetch("/api/public/speechify/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.answer.slice(0, 800),
          speechToken: result.speechToken,
        }),
      });
      if (!response.ok) throw new Error("Read aloud unavailable");

      const blob = await response.blob();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.addEventListener("ended", () => setAudioState("idle"), { once: true });
      audio.addEventListener("error", () => setAudioState("idle"), { once: true });
      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("idle");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="public-mapable-question" className="text-sm font-black text-[#0C1833]">
          Ask a public MapAble question
        </label>
        <p id="public-mapable-question-help" className="mt-1 text-sm leading-6 text-slate-600">
          Answers are limited to material MapAble has deliberately placed in its public knowledge namespace.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            id="public-mapable-question"
            aria-describedby="public-mapable-question-help"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={!enabled}
            maxLength={1200}
            placeholder="For example: What is MapAble building for accessible transport?"
            className="min-h-12 min-w-0 flex-1 rounded-xl border-2 border-slate-300 px-4 py-3 text-base text-[#0C1833] outline-none focus:border-[#005B7F] focus:ring-4 focus:ring-[#F8C51C]/30 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!enabled || status === "loading" || question.trim().length < 3}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#005B7F] px-5 py-3 font-black text-white hover:bg-[#004766] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            <Search size={18} aria-hidden="true" />
            {status === "loading" ? "Checking…" : "Ask"}
          </button>
        </div>
        {!enabled ? (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">
            The public knowledge guide is wired but not enabled in this environment.
          </p>
        ) : null}
        {status === "error" ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">
            {error}
          </p>
        ) : null}
      </form>

      {result ? (
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="mapable-display text-2xl font-black text-[#0C1833]">MapAble answer</h2>
            {ttsEnabled && result.speechToken ? (
              <button
                type="button"
                onClick={readAloud}
                disabled={audioState === "loading"}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#005B7F] px-4 py-2 text-sm font-black text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                {audioState === "playing" ? (
                  <Pause size={18} aria-hidden="true" />
                ) : audioState === "paused" ? (
                  <Play size={18} aria-hidden="true" />
                ) : (
                  <Volume2 size={18} aria-hidden="true" />
                )}
                {audioState === "loading"
                  ? "Preparing…"
                  : audioState === "playing"
                    ? "Pause"
                    : audioState === "paused"
                      ? "Resume"
                      : "Listen"}
              </button>
            ) : null}
          </div>
          <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-700">{result.answer}</p>

          {result.sources.length ? (
            <section className="mt-6">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#005B7F]">Sources used</h3>
              <ul className="mt-3 space-y-2">
                {result.sources.map((source) => (
                  <li key={source.key} className="rounded-xl bg-[#F6FBFC] p-3 text-sm text-slate-700">
                    <code className="font-bold text-[#0C1833]">{source.key}</code>
                    <span className="mt-1 block">{source.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.uncertainty.length ? (
            <section className="mt-6">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#005B7F]">Limits and uncertainty</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                {result.uncertainty.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
