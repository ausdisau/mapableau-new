"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MapLibreProvider } from "@/components/map/MapLibreMap";
import type { ProviderChatContext } from "@/lib/provider/finder/provider-chat-session";

import ProviderSearchProfileForm from "./ProviderSearchProfileForm";

type Provider = {
  id: string; name: string; suburb: string | null; state: string | null;
  postcode: string | null; services: string[]; registrationGroups: string[];
  sourceUpdatedAt: string; evidence: string; workerScreening: string;
  fitExplanation: string; latitude: number | null; longitude: number | null;
};
type ChatEvent = {
  type: "status" | "message" | "provider" | "context" | "complete" | "error";
  text?: string; provider?: Provider; count?: number; hasMore?: boolean;
  applied?: {
    state: string | null; postcode: string | null; suburb: string | null;
    serviceTypes: string[];
  };
  personalised?: boolean;
  nextContext?: ProviderChatContext;
};

type Props = { onMapResults?: (pins: MapLibreProvider[]) => void };

export default function ProviderChatStream({ onMapResults }: Props) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [communication, setCommunication] = useState("No preference");
  const [useSearchOnlyFilters, setUseSearchOnlyFilters] = useState(false);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [useSavedProfile, setUseSavedProfile] = useState(false);
  const [results, setResults] = useState<Provider[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [searchContext, setSearchContext] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [previousContext, setPreviousContext] = useState<ProviderChatContext | null>(null);
  const previousContextUpdatedAt = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const onSavedAvailabilityChange = useCallback((available: boolean) => {
    setHasSavedProfile(available);
    if (!available) setUseSavedProfile(false);
  }, []);

  useEffect(() => {
    if (!onMapResults) return;
    const pins = results.filter((provider) =>
      provider.latitude != null && provider.longitude != null &&
      Number.isFinite(provider.latitude) && Number.isFinite(provider.longitude) &&
      Math.abs(provider.latitude) <= 90 && Math.abs(provider.longitude) <= 180 &&
      provider.latitude !== 0 && provider.longitude !== 0,
    ).map((provider) => ({
      id: provider.id, name: provider.name, suburb: provider.suburb ?? "",
      state: provider.state ?? "", lat: provider.latitude!, lng: provider.longitude!,
    }));
    onMapResults(pins);
  }, [results, onMapResults]);

  async function runSearch(queryText: string) {
    if (!queryText.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const applySavedProfile = hasSavedProfile && useSavedProfile;
    setUseSavedProfile(false); // Consent to reuse a stored profile is per search, not sticky.
    const validPreviousContext =
      previousContext && Date.now() - previousContextUpdatedAt.current <= 30 * 60_000
        ? previousContext : undefined;
    if (!validPreviousContext) {
      setPreviousContext(null);
      setHasMore(false);
    }
    setLog((previous) => [...previous, "You: " + queryText].slice(-24));
    setResults([]); setLastStatus("Searching provider records…"); setSearchContext(null); setBusy(true);

    try {
      const response = await fetch("/api/providers/chat-search", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          previous: validPreviousContext,
          useSavedProfile: applySavedProfile,
          preferences: useSearchOnlyFilters ? {
            usePreferences: true, state: state || undefined,
            postcode: postcode.trim() || undefined, communication,
          } : { usePreferences: false },
        }),
      });
      if (!response.ok || !response.body) {
        let errorMessage = "Provider search could not start.";
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) errorMessage = data.error;
        } catch { /* no structured error */ }
        if (response.status === 401) errorMessage = "Sign in to use conversational provider search.";
        throw new Error(errorMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      const handleLine = (line: string) => {
        if (!line.trim()) return;
        const entry = JSON.parse(line) as ChatEvent;
        if (entry.type === "provider" && entry.provider) {
          setResults((previous) => [...previous, entry.provider!]);
        }
        if (entry.type === "status" && entry.text) setLastStatus(entry.text);
        if ((entry.type === "message" || entry.type === "error") && entry.text) {
          setLog((previous) => [...previous, "MapAble: " + entry.text!].slice(-24));
        }
        if (entry.type === "complete") {
          setLastStatus(null);
          setHasMore(Boolean(entry.hasMore));
          if (entry.nextContext) {
            setPreviousContext(entry.nextContext);
            previousContextUpdatedAt.current = Date.now();
          }
        }
        if (entry.type === "context" && entry.applied) {
          const applied = entry.applied;
          const filters = [applied.suburb, applied.postcode, applied.state, ...applied.serviceTypes].filter(Boolean);
          setSearchContext((entry.personalised ? "Saved preferences applied. " : "Search-only filters applied. ") +
            (filters.length ? "Directory filters: " + filters.join(", ") : "No recognised directory filters."));
        }
      };
      while (true) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        for (const line of lines) handleLine(line);
        if (done) {
          if (pending.trim()) handleLine(pending);
          break;
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setLastStatus(null);
        setLog((previous) => [
          ...previous, "MapAble: " + (error instanceof Error ? error.message : "Search failed"),
        ].slice(-24));
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(message);
  }

  function clearConversation() {
    abortRef.current?.abort();
    setBusy(false);
    setLog([]);
    setResults([]);
    setMessage("");
    setPreviousContext(null);
    previousContextUpdatedAt.current = 0;
    setHasMore(false);
    setLastStatus(null);
    setSearchContext(null);
    setUseSavedProfile(false);
  }

  return (
    <section aria-labelledby="chat-provider-heading" className="space-y-4 rounded-xl border p-4">
      <h2 id="chat-provider-heading" className="text-xl font-semibold">Chat-based provider and worker discovery</h2>
      <p className="text-sm text-muted-foreground">
        Describe support needs in everyday language. MapAble searches imported provider classifications.
        Individual worker profiles and current screening clearances are not available through this directory.
      </p>
      <ProviderSearchProfileForm onSavedAvailabilityChange={onSavedAvailabilityChange} />
      <form onSubmit={submit} className="space-y-3">
        <label className="block font-medium" htmlFor="provider-chat-input">What support are you looking for?</label>
        <textarea id="provider-chat-input" rows={3} maxLength={500} required value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Find support coordination near St Ives NSW; or find disability support workers in 2075"
          className="w-full rounded-md border bg-background p-3" />
        {hasSavedProfile && <label className="flex items-center gap-2">
          <input type="checkbox" checked={useSavedProfile}
            onChange={(event) => setUseSavedProfile(event.target.checked)} />
          Use my saved matching preferences for this search
        </label>}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={useSearchOnlyFilters}
            onChange={(event) => setUseSearchOnlyFilters(event.target.checked)} />
          Add temporary filters for this search (not saved)
        </label>
        {useSearchOnlyFilters && <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">State
            <select className="rounded-md border bg-background p-2" value={state} onChange={(event) => setState(event.target.value)}>
              <option value="">Any state</option>
              {["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">Postcode
            <input className="rounded-md border bg-background p-2" value={postcode}
              onChange={(event) => setPostcode(event.target.value)} inputMode="numeric"
              pattern="[0-9]{4}" maxLength={4} />
          </label>
          <label className="flex flex-col gap-1">Communication preference (requires confirmation)
            <select className="rounded-md border bg-background p-2" value={communication}
              onChange={(event) => setCommunication(event.target.value)}>
              {["No preference", "AAC", "Text", "Auslan"].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>}
        <div className="flex flex-wrap gap-2">
          <button disabled={busy || !message.trim()} type="submit"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
            Search provider directory
          </button>
          {hasMore && !busy && <button type="button" className="rounded-md border px-4 py-2"
            disabled={Boolean(previousContext?.fromSavedProfile && !useSavedProfile)}
            onClick={() => void runSearch("Show more")}>
            Show more results
          </button>}
          {busy && <button type="button" className="rounded-md border px-4 py-2"
            onClick={() => { abortRef.current?.abort(); setLastStatus(null); setBusy(false); }}>Stop search</button>}
          <button type="button" className="rounded-md border px-4 py-2"
            onClick={clearConversation}>Clear conversation</button>
        </div>
      </form>
      <p className="text-xs text-muted-foreground">Conversation context remains in this browser tab only, expires after 30 minutes of inactivity, and is not saved to Neon. Clear conversation to discard it sooner.</p>
      {hasMore && previousContext?.fromSavedProfile && !useSavedProfile && <p className="text-sm">
        To see more results from the saved-profile search, select your saved profile again.
      </p>}
      {lastStatus && <p role="status" aria-live="polite">{lastStatus}</p>}
      <div role="log" aria-live="polite" aria-label="Current chat conversation" className="space-y-2">
        {log.map((entry, index) => <p key={index}>{entry}</p>)}
        {searchContext && <p className="text-sm text-muted-foreground">{searchContext}</p>}
      </div>
      {results.length > 0 && <p className="text-sm">
        Results with coordinates are also shown on the map below. Registration and access requirements need confirmation.
      </p>}
      <div aria-label="Chat search provider results" className="grid gap-3 md:grid-cols-2">
        {results.map((provider) => <article key={provider.id} className="space-y-2 rounded-lg border p-3">
          <h3 className="font-semibold">{provider.name}</h3>
          <p className="text-sm">{[provider.suburb, provider.state, provider.postcode].filter(Boolean).join(", ")}</p>
          <p className="text-sm">Service labels: {provider.services.length ? provider.services.slice(0, 3).join(", ") : "Not listed"}</p>
          <p className="text-sm">Registration groups in imported record: {provider.registrationGroups.length
            ? provider.registrationGroups.slice(0, 3).join(", ") : "Not listed"}</p>
          <p className="text-xs text-muted-foreground">{provider.evidence}. {provider.fitExplanation}</p>
          <p className="text-xs">Worker screening: {provider.workerScreening}.
            Local record updated: {new Date(provider.sourceUpdatedAt).toLocaleDateString("en-AU")}.
          </p>
        </article>)}
      </div>
      <p className="text-sm">
        <a className="underline" href="https://www.ndiscommission.gov.au/provider-registration/find-registered-provider">
          Check current provider registration
        </a>
        {" · "}
        <a className="underline" href="https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-participants">
          Official worker screening pathway
        </a>
      </p>
    </section>
  );
}
