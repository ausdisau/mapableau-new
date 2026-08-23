"use client";

import { useId, useState } from "react";

import { ExperimentShell } from "@/components/labs/ExperimentShell";
import {
  DEFAULT_LABS_VISION_IMAGE_URL,
  DEFAULT_LABS_VISION_PROMPT,
} from "@/lib/labs/hf";

export function VisionProbeExperiment() {
  const promptId = useId();
  const imageId = useId();
  const outputId = useId();
  const [prompt, setPrompt] = useState(DEFAULT_LABS_VISION_PROMPT);
  const [imageUrl, setImageUrl] = useState(DEFAULT_LABS_VISION_IMAGE_URL);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runDescribe() {
    setBusy(true);
    setError(null);
    setOutput("");
    try {
      const res = await fetch("/api/labs/vision/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageUrl }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null;
        throw new Error(
          payload?.error ||
            payload?.message ||
            `Vision probe failed (${res.status})`,
        );
      }

      if (!res.body) {
        throw new Error("No stream returned from vision probe.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setOutput(text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vision probe failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ExperimentShell
      title="Vision Probe"
      summary="Optional Hugging Face Router demo: stream a one-sentence description of an image. Experimental only — not used for Mobility Futures decisions and never written to GAIS evidence."
      status="DEMONSTRATION"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6 min-w-0">
          <section
            className="rounded-3xl border border-white/10 p-5"
            aria-labelledby="vision-inputs-heading"
          >
            <h2 id="vision-inputs-heading" className="text-xl font-black">
              Inputs
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Requires server env <code className="text-[#F8C51C]">HF_TOKEN</code>.
              Model defaults to Muse-Glimmer via Hugging Face Router.
            </p>

            <label className="mt-5 block text-sm font-bold" htmlFor={promptId}>
              Prompt
            </label>
            <textarea
              id={promptId}
              className="mt-2 min-h-24 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
            />

            <label className="mt-4 block text-sm font-bold" htmlFor={imageId}>
              Image URL (https or data:image)
            </label>
            <input
              id={imageId}
              type="url"
              className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="min-h-12 rounded-xl bg-[#F8C51C] px-5 font-black text-[#071727] focus:outline-none focus:ring-4 focus:ring-white/40 disabled:opacity-50"
                onClick={runDescribe}
                disabled={busy || !imageUrl.trim()}
              >
                {busy ? "Streaming…" : "Describe image"}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-xl border border-white/20 px-5 font-black focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                onClick={() => {
                  setPrompt(DEFAULT_LABS_VISION_PROMPT);
                  setImageUrl(DEFAULT_LABS_VISION_IMAGE_URL);
                  setOutput("");
                  setError(null);
                }}
                disabled={busy}
              >
                Reset demo defaults
              </button>
            </div>
          </section>

          <section
            className="rounded-3xl border border-white/10 p-5"
            aria-labelledby={outputId}
          >
            <h2 id={outputId} className="text-xl font-black">
              Streamed description
            </h2>
            <div
              className="mt-4 min-h-28 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/85"
              role="status"
              aria-live="polite"
            >
              {error ? (
                <p className="text-red-300">{error}</p>
              ) : output ? (
                <p>{output}</p>
              ) : (
                <p className="text-white/50">
                  {busy
                    ? "Waiting for the first tokens…"
                    : "No description yet. Run the probe to stream text here."}
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview of the image URL that will be sent to the Labs vision probe"
              className="max-h-72 w-full object-cover"
            />
          </div>
          <ul className="space-y-2 rounded-3xl border border-white/10 p-4 text-sm leading-6 text-white/70">
            <li>Labs simulation / demonstration only.</li>
            <li>Not wired into Mobility Futures autonomy modes.</li>
            <li>Responses are not stored as research data in P0.</li>
            <li>Responses never become live GAIS evidence.</li>
          </ul>
        </aside>
      </div>
    </ExperimentShell>
  );
}
