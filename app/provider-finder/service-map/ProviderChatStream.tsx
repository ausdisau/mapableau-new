"use client";

import { useRef, useState } from "react";

type Provider = {
  id: string; name: string; suburb: string | null; state: string | null;
  postcode: string | null; services: string[]; sourceUpdatedAt: string;
  evidence: string; workerScreening: string;
  latitude: number | null; longitude: number | null;
};
type Event = {
  type: "status" | "message" | "provider" | "context" | "complete" | "error";
  text?: string; provider?: Provider; count?: number;
  applied?: { state: string | null; postcode: string | null; service: string | null };
  note?: string;
};

export default function ProviderChatStream() {
  const [message, setMessage] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [communication, setCommunication] = useState("No preference");
  const [usePreferences, setUsePreferences] = useState(false);
  const [results, setResults] = useState<Provider[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLog([]); setResults([]); setBusy(true);
    try {
      const response = await fetch("/api/providers/chat-search", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          preferences: {
            usePreferences,
            ...(usePreferences ? {
              state,
              postcode: postcode.trim() || undefined,
              communication,
            } : {}),
          },
        }),
      });
      if (response.status === 401) { setLog(["Sign in to MapAble to use personalised provider search."]); return; }
      if (!response.ok || !response.body) throw new Error("Unable to start search");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      while (true) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as Event;
          if (event.type === "provider" && event.provider) setResults((previous) => [...previous, event.provider!]);
          if ((event.type === "message" || event.type === "error" || event.type === "status") && event.text) {
            setLog((previous) => [...previous, event.text!]);
          }
        }
        if (done) break;
      }
    } catch (error) {
      if (!controller.signal.aborted) setLog((previous) => [...previous, error instanceof Error ? error.message : "Search failed"]);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <section aria-labelledby="chat-provider-heading" className="space-y-4 rounded-xl border p-4">
      <h2 id="chat-provider-heading" className="text-xl font-semibold">Search providers and workers by chat</h2>
      <p className="text-sm text-muted-foreground">
        Describe the supports you want in everyday language. Worker-level profiles and screening are not available in this directory.
        Results come from imported provider records, not live regulatory checks.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <label className="block font-medium" htmlFor="provider-chat-input">What support are you looking for?</label>
        <textarea id="provider-chat-input" rows={3} maxLength={500} required value={message}
          onChange={(event) => setMessage(event.target.value)} placeholder="Find support coordination providers in NSW"
          className="w-full rounded-md border bg-background p-3" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={usePreferences} onChange={(event) => setUsePreferences(event.target.checked)} />
          Apply my optional preferences to this search
        </label>
        {usePreferences && <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">State
            <select className="rounded-md border bg-background p-2" value={state} onChange={(event) => setState(event.target.value)}>
              {["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">Postcode (optional)
            <input className="rounded-md border bg-background p-2" value={postcode} onChange={(event) => setPostcode(event.target.value)} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} />
          </label>
          <label className="flex flex-col gap-1">Communication preference
            <select className="rounded-md border bg-background p-2" value={communication} onChange={(event) => setCommunication(event.target.value)}>
              {["No preference", "AAC", "Text", "Auslan"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
        </div>}
        <div className="flex gap-2">
          <button disabled={busy || !message.trim()} type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Search</button>
          {busy && <button type="button" className="rounded-md border px-4 py-2" onClick={() => { abortRef.current?.abort(); setBusy(false); }}>Stop</button>}
        </div>
      </form>
      <div role="status" aria-live="polite" aria-atomic="false" className="space-y-2">
        {log.map((entry, index) => <p key={index}>{entry}</p>)}
      </div>
      <div aria-label="Chat search provider results" className="grid gap-3 md:grid-cols-2">
        {results.map((provider) => <article key={provider.id} className="space-y-2 rounded-lg border p-3">
          <h3 className="font-semibold">{provider.name}</h3>
          <p className="text-sm">{[provider.suburb, provider.state, provider.postcode].filter(Boolean).join(", ")}</p>
          <p className="text-sm">{provider.services.length ? provider.services.join(", ") : "Services not listed"}</p>
          <p className="text-xs text-muted-foreground">{provider.evidence}. Worker screening: {provider.workerScreening}.</p>
          <p className="text-xs">Imported record updated: {new Date(provider.sourceUpdatedAt).toLocaleDateString("en-AU")}</p>
        </article>)}
      </div>
    </section>
  );
}
