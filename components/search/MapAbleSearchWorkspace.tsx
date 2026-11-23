"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleSearchDemoAtlas } from "@/components/search/MapAbleSearchDemoAtlas";
import { MapAbleSearchDemoInterior } from "@/components/search/MapAbleSearchDemoInterior";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapableSearchInputClass } from "@/lib/brand/styles";
import {
  AAC_PHRASES,
  ALTERNATIVE_ROUTE_NOTICE,
  DEFAULT_DOORWAY_MINIMUM_MM,
  DEMO_USER_MESSAGE,
  ST_IVES_DEMO_CLINICS,
  ST_IVES_DEMO_DISCLOSURE,
  ST_IVES_DEMO_SOURCE,
  assistantSummaryForMinimum,
  buildComparisonRows,
  getClinicById,
  shouldPopulateStIvesDemo,
  summariseDemoMatches,
  whyTheseResults,
  type DemoClinicId,
} from "@/lib/search/demo/st-ives-search-demo";
import {
  SEARCH_QUERY_MAX,
  buildMapAbleSearchUrl,
  deepSearchAvailable,
  validateSearchQuery,
  withPresentation,
  withTier,
  type SearchCategory,
  type SearchPresentation,
  type SearchSelection,
  type SearchTier,
} from "@/lib/search/mapable-search-ui";

type ViewMode = "list" | "map" | "floor";

type Props = {
  initialSelection: SearchSelection;
  populateDemo: boolean;
  className?: string;
};

const SCOPE_OPTIONS: Array<{
  id: SearchCategory | "foundational";
  label: string;
  href?: string;
  note?: string;
}> = [
  { id: "all", label: "All" },
  { id: "places", label: "Places", href: "/accessibility-map" },
  { id: "providers", label: "Providers", href: "/provider-finder" },
  { id: "care", label: "Care", href: "/care" },
  { id: "transport", label: "Transport", href: "/transport" },
  { id: "jobs", label: "Jobs", href: "/employment" },
  {
    id: "foundational",
    label: "Foundational",
    href: "/care",
    note: "Programme explainer — not a live filter in this demo",
  },
];

export function MapAbleSearchWorkspace({
  initialSelection,
  populateDemo,
  className,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const baseId = useId();
  const searchRegionRef = useRef<HTMLElement>(null);
  const resultsRegionRef = useRef<HTMLElement>(null);
  const consentTriggerRef = useRef<HTMLButtonElement>(null);
  const draftBeforeVoiceRef = useRef("");
  const recognitionRef = useRef<{
    stop?: () => void;
    abort?: () => void;
    onresult: unknown;
    onerror: unknown;
  } | null>(null);

  const [selection, setSelection] = useState<SearchSelection>(
    () => initialSelection,
  );
  const [draft, setDraft] = useState(
    () => initialSelection.query || (populateDemo ? DEMO_USER_MESSAGE : ""),
  );
  const [demoActive, setDemoActive] = useState(populateDemo);
  const [submittedQuery, setSubmittedQuery] = useState(() =>
    populateDemo ? initialSelection.query || DEMO_USER_MESSAGE : "",
  );
  const [selectedClinicId, setSelectedClinicId] = useState<DemoClinicId>(
    "demo-clinic-st-ives-allied-health",
  );
  const [doorMinimum, setDoorMinimum] = useState(DEFAULT_DOORWAY_MINIMUM_MM);
  const [doorInput, setDoorInput] = useState(
    String(DEFAULT_DOORWAY_MINIMUM_MM),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    populateDemo ? "map" : "list",
  );
  const [transitPathOn, setTransitPathOn] = useState(true);
  const [sensoryLayerOn, setSensoryLayerOn] = useState(false);
  const [showAltRoute, setShowAltRoute] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<
    "idle" | "unavailable" | "listening"
  >("idle");
  const [liveMessage, setLiveMessage] = useState("");
  const [queryError, setQueryError] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);

  const matchSummary = summariseDemoMatches(doorMinimum);
  const comparisonRows = buildComparisonRows(doorMinimum);
  const selectedClinic = getClinicById(selectedClinicId);
  const showResults = demoActive;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!consentOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConsentOpen(false);
        consentTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [consentOpen]);

  function announce(message: string) {
    setLiveMessage(message);
  }

  function selectClinic(id: DemoClinicId) {
    setSelectedClinicId(id);
    const clinic = getClinicById(id);
    announce(
      `Selected ${clinic.name}. ${matchSummary.matchCount} match, ${matchSummary.alternativeCount} alternative.`,
    );
    if (viewMode === "floor" && !clinic.hasFloorPlan) {
      // Keep floor view; interior component shows missing-plan state.
    }
  }

  function updateDoorMinimum(next: number) {
    setDoorMinimum(next);
    setDoorInput(String(next));
    const nextSummary = summariseDemoMatches(next);
    announce(nextSummary.summary);
    if (
      nextSummary.matches[0] &&
      !nextSummary.matches.some((c) => c.id === selectedClinicId)
    ) {
      setSelectedClinicId(nextSummary.matches[0]?.id ?? selectedClinicId);
    }
  }

  function commitDoorInput(raw: string) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      setDoorInput(String(doorMinimum));
      return;
    }
    const clamped = Math.min(1200, Math.max(700, Math.round(parsed)));
    updateDoorMinimum(clamped);
  }

  function applyPresentation(presentation: SearchPresentation) {
    const next = withPresentation(selection, presentation);
    setSelection(next);
    startTransition(() => {
      const url = buildMapAbleSearchUrl(next);
      // Keep the labelled St Ives demo only while Conversation stays active.
      const nextUrl =
        presentation === "conversation" && demoActive
          ? `${url}${url.includes("?") ? "&" : "?"}demo=st-ives`
          : url;
      router.push(nextUrl);
    });
  }

  function applyTier(tier: SearchTier) {
    const next = withTier(selection, tier);
    setSelection(next);
  }

  function insertAac(text: string) {
    setDraft(text);
    announce(
      "Phrase added to the search field. Edit or press Search when ready.",
    );
  }

  function startVoice() {
    draftBeforeVoiceRef.current = draft;
    type SpeechRec = {
      start: () => void;
      stop?: () => void;
      abort?: () => void;
      onresult:
        | ((event: {
            results: ArrayLike<ArrayLike<{ transcript: string }>>;
          }) => void)
        | null;
      onerror: (() => void) | null;
    };
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              SpeechRecognition?: new () => SpeechRec;
              webkitSpeechRecognition?: new () => SpeechRec;
            }
          ).SpeechRecognition ||
          (
            window as unknown as {
              webkitSpeechRecognition?: new () => SpeechRec;
            }
          ).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionCtor) {
      setVoiceState("unavailable");
      announce(
        "Voice is unavailable. Keep typing or use AAC. Your draft is unchanged.",
      );
      return;
    }

    recognitionRef.current?.abort?.();
    recognitionRef.current?.stop?.();
    setVoiceState("listening");
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setDraft((current) =>
        current ? `${current.trim()} ${transcript}`.trim() : transcript,
      );
      setVoiceState("idle");
      recognitionRef.current = null;
      announce("Voice draft ready. Edit, cancel or press Search.");
    };
    recognition.onerror = () => {
      if (recognitionRef.current !== recognition) return;
      setVoiceState("unavailable");
      setDraft(draftBeforeVoiceRef.current);
      recognitionRef.current = null;
      announce("Voice cancelled. Typing and AAC remain available.");
    };
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoiceState("unavailable");
      announce("Voice could not start. Keep typing or use AAC.");
    }
  }

  function cancelVoiceDraft() {
    const active = recognitionRef.current;
    recognitionRef.current = null;
    try {
      active?.abort?.();
      active?.stop?.();
    } catch {
      // Ignore stop errors when recognition already ended.
    }
    setDraft(draftBeforeVoiceRef.current);
    setVoiceState("idle");
    announce("Voice draft discarded.");
  }

  function handleSearch(event?: React.FormEvent) {
    event?.preventDefault();
    const validated = validateSearchQuery(draft);
    if (!validated.ok) {
      setQueryError(validated.error);
      return;
    }
    setQueryError(undefined);
    const next: SearchSelection = {
      ...selection,
      query: validated.query,
      presentation: selection.presentation,
      tier:
        selection.tier === "deep" && !deepSearchAvailable
          ? "deep"
          : selection.tier,
    };
    const useDemo =
      next.presentation === "conversation" &&
      shouldPopulateStIvesDemo({
        demoParam: null,
        presentation: next.presentation,
        query: next.query,
      });
    setSelection(next);
    setSubmittedQuery(next.query);
    setDemoActive(useDemo);
    announce(
      useDemo
        ? "Search updated. Synthetic St Ives results refreshed."
        : "Search updated. This Conversation demo only populates for the St Ives physio scenario — try Web for public destinations.",
    );
    startTransition(() => {
      const url = buildMapAbleSearchUrl(next);
      const nextUrl = useDemo
        ? `${url}${url.includes("?") ? "&" : "?"}demo=st-ives`
        : url;
      router.push(nextUrl);
    });
  }

  const radioItemClass = cn(
    "inline-flex min-h-12 min-w-[5.5rem] cursor-pointer items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-black text-[#0C1833] transition has-[:checked]:border-[#005B7F] has-[:checked]:bg-[#005B7F] has-[:checked]:text-white",
    mapableCareFocusRing,
  );

  return (
    <div
      className={cn("space-y-3", className)}
      data-testid="mapable-search-workspace"
      data-hydrated={hydrated ? "true" : "false"}
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      {/* Utility row */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        <p className="flex flex-wrap gap-3">
          <a
            href="#search-region"
            className={cn(
              "font-semibold text-[#005B7F] underline",
              mapableCareFocusRing,
            )}
            onClick={(event) => {
              event.preventDefault();
              searchRegionRef.current?.focus();
            }}
          >
            Skip to search
          </a>
          <a
            href="#results-region"
            className={cn(
              "font-semibold text-[#005B7F] underline",
              mapableCareFocusRing,
            )}
            onClick={(event) => {
              event.preventDefault();
              resultsRegionRef.current?.focus();
            }}
          >
            Skip to results
          </a>
        </p>
        <p className="text-xs font-semibold text-slate-600">
          {ST_IVES_DEMO_DISCLOSURE}
        </p>
        <a
          href="tel:000"
          className={cn(
            "inline-flex min-h-11 items-center rounded-lg bg-[#F8C51C] px-3 text-sm font-black text-[#0C1833]",
            mapableCareFocusRing,
          )}
        >
          In an emergency, call 000
        </a>
      </div>

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/mapable-search/mapable-search-logo.png"
            alt="MapAble Search"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <div>
            <p className="font-heading text-lg font-bold text-[#0C1833]">
              MapAble Search
            </p>
            <p className="text-sm text-slate-600">
              Access profile: Power chair · Quiet spaces
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/accessibility"
            className={cn(
              "inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold",
              mapableCareFocusRing,
            )}
          >
            Aa Text size
          </Link>
          <Link
            href="/accessibility"
            className={cn(
              "inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold",
              mapableCareFocusRing,
            )}
          >
            Contrast
          </Link>
          <Link
            href="/accessibility"
            className={cn(
              "inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold",
              mapableCareFocusRing,
            )}
          >
            Easy read
          </Link>
          <Link
            href="/contact"
            className={cn(
              "inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-3 text-sm font-black text-[#0C1833]",
              mapableCareFocusRing,
            )}
          >
            Talk to a person
          </Link>
          <Link
            href="/contact"
            className={cn(
              "inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#005B7F] underline",
              mapableCareFocusRing,
            )}
          >
            Text support
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-3xl border border-slate-200 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
        {/* Left pane */}
        <section
          id="search-region"
          ref={searchRegionRef}
          tabIndex={-1}
          aria-labelledby={`${baseId}-search-heading`}
          className="space-y-5 bg-[#0C1833] p-5 text-white sm:p-6"
        >
          <div className="space-y-2">
            <h1
              id={`${baseId}-search-heading`}
              className="font-heading text-3xl font-bold leading-tight sm:text-4xl"
            >
              Find what works for you.
            </h1>
            <p className="text-base font-medium italic text-white/90">
              One search. An accessible Australia.
            </p>
          </div>

          <form
            role="search"
            onSubmit={handleSearch}
            className="space-y-4"
            aria-describedby={`${baseId}-help`}
          >
            <fieldset className="space-y-2">
              <legend className="text-sm font-black">Presentation</legend>
              <div
                role="radiogroup"
                aria-label="Search experience"
                className="flex flex-wrap gap-2"
              >
                {(
                  [
                    ["web", "Web"],
                    ["conversation", "Conversation"],
                  ] as const
                ).map(([value, label]) => {
                  const inputId = `${baseId}-presentation-${value}`;
                  return (
                    <label
                      key={value}
                      htmlFor={inputId}
                      className={radioItemClass}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        className="sr-only"
                        name={`${baseId}-presentation`}
                        checked={selection.presentation === value}
                        onChange={() => applyPresentation(value)}
                        aria-label={label}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-black">Search depth</legend>
              <div
                role="radiogroup"
                aria-label="Search depth"
                className="flex flex-wrap gap-2"
              >
                <label
                  htmlFor={`${baseId}-tier-quick`}
                  className={radioItemClass}
                >
                  <input
                    id={`${baseId}-tier-quick`}
                    type="radio"
                    className="sr-only"
                    name={`${baseId}-tier`}
                    checked={selection.tier === "quick"}
                    onChange={() => applyTier("quick")}
                    aria-label="Quick · Free"
                  />
                  Quick · Free
                </label>
                <label
                  htmlFor={`${baseId}-tier-deep`}
                  className={cn(
                    radioItemClass,
                    "cursor-not-allowed opacity-70 has-[:checked]:border-slate-400 has-[:checked]:bg-slate-200 has-[:checked]:text-slate-700",
                  )}
                >
                  <input
                    id={`${baseId}-tier-deep`}
                    type="radio"
                    className="sr-only"
                    name={`${baseId}-tier`}
                    checked={selection.tier === "deep"}
                    onChange={() => applyTier("deep")}
                    aria-label="Deep · Credits"
                  />
                  Deep · Credits
                </label>
              </div>
              {!deepSearchAvailable ? (
                <p className="text-xs text-white/80">
                  Deep Search is unavailable. Credits are not charged. Quick
                  remains usable.
                </p>
              ) : null}
            </fieldset>

            <div>
              <p className="mb-2 text-sm font-black">Scope</p>
              <ul className="flex flex-wrap gap-2">
                {SCOPE_OPTIONS.map((option) => (
                  <li key={option.id}>
                    {option.href ? (
                      <Link
                        href={option.href}
                        title={option.note}
                        className={cn(
                          "inline-flex min-h-12 items-center rounded-full border border-white/30 px-3 text-sm font-semibold text-white hover:bg-white/10",
                          mapableCareFocusRing,
                        )}
                      >
                        {option.label}
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-12 items-center rounded-full bg-[#005B7F] px-3 text-sm font-black">
                        {option.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {showResults ? (
              <div className="space-y-3 rounded-2xl bg-white/5 p-3">
                <p className="text-sm">
                  <span className="font-black">Alex</span>
                  <span className="mt-1 block rounded-xl bg-white/10 p-3 text-white">
                    {submittedQuery || DEMO_USER_MESSAGE}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-black">MapAble</span>
                  <span className="mt-1 block rounded-xl bg-[#005B7F] p-3">
                    {assistantSummaryForMinimum(doorMinimum)}
                  </span>
                </p>
              </div>
            ) : submittedQuery ? (
              <div className="space-y-3 rounded-2xl bg-white/5 p-3">
                <p className="text-sm">
                  <span className="font-black">Alex</span>
                  <span className="mt-1 block rounded-xl bg-white/10 p-3 text-white">
                    {submittedQuery}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-black">MapAble</span>
                  <span className="mt-1 block rounded-xl bg-[#005B7F] p-3">
                    This Conversation demo only loads synthetic St Ives physio
                    clinics for matching queries (or{" "}
                    <code className="text-xs">?demo=st-ives</code>). Switch to
                    Web for public MapAble destinations, or try “Find a physio
                    near St Ives with a ceiling hoist”.
                  </span>
                </p>
              </div>
            ) : (
              <p className="rounded-2xl bg-white/5 p-3 text-sm text-white/85">
                Start with a phrase, type a question, or switch to Web for
                public MapAble destinations. No synthetic clinics are shown
                until you search or open the St Ives demo.
              </p>
            )}

            <div>
              <p id={`${baseId}-aac-label`} className="mb-2 text-sm font-black">
                AAC quick phrases
              </p>
              <ul
                aria-labelledby={`${baseId}-aac-label`}
                className="grid grid-cols-2 gap-2"
              >
                {AAC_PHRASES.map((phrase) => (
                  <li key={phrase.id}>
                    <button
                      type="button"
                      onClick={() => insertAac(phrase.insert)}
                      className={cn(
                        "flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-white/25 bg-white px-2 text-center text-sm font-black text-[#0C1833] hover:border-[#F8C51C]",
                        mapableCareFocusRing,
                      )}
                    >
                      {phrase.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {showAltRoute || showResults ? (
              <div className="rounded-xl border border-[#F8C51C]/60 bg-[#F8C51C]/15 p-3 text-sm text-white">
                <p>{ALTERNATIVE_ROUTE_NOTICE}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(
                      "min-h-11 rounded-lg border border-white/40 px-3 font-semibold",
                      mapableCareFocusRing,
                    )}
                    onClick={() => setShowAltRoute((value) => !value)}
                  >
                    Why?
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "min-h-11 rounded-lg bg-[#F8C51C] px-3 font-black text-[#0C1833]",
                      mapableCareFocusRing,
                    )}
                    onClick={() => setShowAltRoute(true)}
                  >
                    Show anyway
                  </button>
                </div>
                {showAltRoute ? (
                  <p className="mt-2 text-xs text-white/85">
                    A ramp measurement alone does not determine suitability for
                    your wheelchair or preferences. Review the route details in
                    text.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor={`${baseId}-q`}
                className="block text-sm font-black"
              >
                Search MapAble
              </label>
              <div className="flex flex-wrap items-stretch gap-2">
                <button
                  type="button"
                  onClick={() =>
                    insertAac(AAC_PHRASES[0]?.insert ?? DEMO_USER_MESSAGE)
                  }
                  className={cn(
                    "inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-white/30 px-3 text-sm font-black",
                    mapableCareFocusRing,
                  )}
                >
                  AAC
                </button>
                <button
                  type="button"
                  onClick={startVoice}
                  className={cn(
                    "inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-white/30 px-3 text-sm font-black",
                    mapableCareFocusRing,
                  )}
                >
                  Voice
                </button>
                {voiceState === "listening" || voiceState === "unavailable" ? (
                  <button
                    type="button"
                    onClick={cancelVoiceDraft}
                    className={cn(
                      "inline-flex min-h-12 items-center rounded-xl border border-white/30 px-3 text-sm font-semibold",
                      mapableCareFocusRing,
                    )}
                  >
                    Cancel voice
                  </button>
                ) : null}
                <input
                  id={`${baseId}-q`}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  maxLength={SEARCH_QUERY_MAX}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (queryError) setQueryError(undefined);
                  }}
                  placeholder="Search places, services, transport, jobs…"
                  className={cn(
                    mapableSearchInputClass,
                    "min-w-[12rem] flex-1",
                  )}
                  aria-invalid={queryError ? true : undefined}
                  aria-describedby={`${baseId}-help`}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className={cn(
                    "inline-flex min-h-12 items-center rounded-xl bg-[#F8C51C] px-4 text-sm font-black text-[#0C1833]",
                    mapableCareFocusRing,
                  )}
                >
                  Search
                </button>
              </div>
              {queryError ? (
                <p role="alert" className="text-sm text-[#F8C51C]">
                  {queryError}
                </p>
              ) : null}
              {voiceState === "unavailable" ? (
                <p className="text-xs text-white/80">
                  Voice unavailable or permission declined. AAC and typing stay
                  available.
                </p>
              ) : null}
              <p id={`${baseId}-help`} className="text-xs text-white/70">
                Do not enter private NDIS plan documents or personal health
                records in this search.
              </p>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-3 border-t border-white/15 pt-3 text-xs">
            <p>NDIS plan private</p>
            <button
              ref={consentTriggerRef}
              type="button"
              className={cn("font-semibold underline", mapableCareFocusRing)}
              onClick={() => setConsentOpen(true)}
            >
              Manage consent
            </button>
          </div>
        </section>

        {/* Right pane — divider lives inside this pane */}
        <section
          id="results-region"
          ref={resultsRegionRef}
          tabIndex={-1}
          aria-labelledby={`${baseId}-results-heading`}
          className="space-y-4 border-t border-slate-200 bg-[#F6FBFC] p-5 sm:p-6 lg:border-l lg:border-t-0"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id={`${baseId}-results-heading`}
                className="font-heading text-2xl font-bold text-[#0C1833]"
              >
                Access near St Ives
              </h2>
              {showResults ? (
                <p className="mt-1 text-sm text-slate-700">
                  Physio · St Ives · Doorway minimum {doorMinimum} mm ·{" "}
                  {matchSummary.summary}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-700">
                  Results appear after you search. Public Web discovery stays
                  separate from this synthetic demo.
                </p>
              )}
            </div>
            <div
              role="group"
              aria-label="Result view"
              className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1"
            >
              {(
                [
                  ["list", "List"],
                  ["map", "2D map"],
                  ["floor", "3D floor plan"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={viewMode === mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "min-h-11 rounded-lg px-3 text-sm font-black",
                    viewMode === mode
                      ? "bg-[#005B7F] text-white"
                      : "text-[#0C1833]",
                    mapableCareFocusRing,
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {showResults ? (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm font-semibold text-[#0C1833]">
                  Doorway minimum (mm)
                  <input
                    type="number"
                    min={700}
                    max={1200}
                    step={10}
                    value={doorInput}
                    onChange={(event) => {
                      const raw = event.target.value;
                      setDoorInput(raw);
                      if (raw === "") return;
                      const parsed = Number(raw);
                      if (
                        Number.isFinite(parsed) &&
                        parsed >= 700 &&
                        parsed <= 1200
                      ) {
                        updateDoorMinimum(Math.round(parsed));
                      }
                    }}
                    onBlur={() => commitDoorInput(doorInput)}
                    className="mt-1 block min-h-11 w-28 rounded-lg border border-slate-300 px-2"
                  />
                </label>
                <button
                  type="button"
                  className={cn(
                    "min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold",
                    mapableCareFocusRing,
                  )}
                  onClick={() => updateDoorMinimum(DEFAULT_DOORWAY_MINIMUM_MM)}
                >
                  Reset 900 mm
                </button>
              </div>

              {viewMode === "list" ? (
                <ul className="space-y-3">
                  {ST_IVES_DEMO_CLINICS.map((clinic) => {
                    const status =
                      (clinic.entranceWidthMm ?? 0) >= doorMinimum
                        ? "Match"
                        : "Below minimum";
                    const selected = clinic.id === selectedClinicId;
                    return (
                      <li key={clinic.id}>
                        <button
                          type="button"
                          onClick={() => selectClinic(clinic.id)}
                          aria-pressed={selected}
                          className={cn(
                            "w-full rounded-2xl border-2 bg-white p-4 text-left",
                            selected ? "border-[#005B7F]" : "border-slate-200",
                            mapableCareFocusRing,
                          )}
                        >
                          <p className="font-heading text-lg font-bold text-[#0C1833]">
                            #{clinic.pinNumber} {clinic.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {clinic.entranceWidthMm} mm door ·{" "}
                            {clinic.ceilingHoist === "listed"
                              ? "Ceiling hoist"
                              : "No hoist"}{" "}
                            ·{" "}
                            {clinic.quietRoom === "listed"
                              ? "Quiet room"
                              : "No quiet room"}{" "}
                            · {clinic.busApproachSummary}
                          </p>
                          <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#005B7F]">
                            {status} · {clinic.shortLabel}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {viewMode === "map" ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2">
                    <MapAbleSearchDemoAtlas
                      selectedClinicId={selectedClinicId}
                      transitPathOn={transitPathOn}
                      sensoryLayerOn={sensoryLayerOn}
                      onSelectClinic={selectClinic}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        aria-pressed={transitPathOn}
                        onClick={() => setTransitPathOn((v) => !v)}
                        className={cn(
                          "min-h-11 rounded-lg border px-3 text-sm font-semibold",
                          transitPathOn
                            ? "border-[#005B7F] bg-[#005B7F]/10 text-[#005B7F]"
                            : "border-slate-300 bg-white",
                          mapableCareFocusRing,
                        )}
                      >
                        Transit path
                      </button>
                      <button
                        type="button"
                        aria-pressed={sensoryLayerOn}
                        onClick={() => setSensoryLayerOn((v) => !v)}
                        className={cn(
                          "min-h-11 rounded-lg border px-3 text-sm font-semibold",
                          sensoryLayerOn
                            ? "border-[#005B7F] bg-[#005B7F]/10 text-[#005B7F]"
                            : "border-slate-300 bg-white",
                          mapableCareFocusRing,
                        )}
                      >
                        Sensory layer
                      </button>
                      <p className="min-h-11 content-center text-xs text-slate-600">
                        Spatial audio off · Sensory layer is illustrative only
                      </p>
                    </div>
                  </div>
                  <MapAbleSearchDemoInterior
                    selectedClinicId={selectedClinicId}
                  />
                </div>
              ) : null}

              {viewMode === "floor" ? (
                <MapAbleSearchDemoInterior
                  selectedClinicId={selectedClinicId}
                />
              ) : null}

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <h3 className="border-b border-slate-200 px-4 py-3 font-heading text-lg font-bold text-[#0C1833]">
                  Compare access notes
                </h3>
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Side-by-side synthetic access measurements for two demo
                    clinics against your doorway minimum.
                  </caption>
                  <thead>
                    <tr className="bg-slate-50">
                      <th scope="col" className="px-4 py-3 font-black">
                        Requirement
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 font-black text-[#005B7F]"
                      >
                        1 {ST_IVES_DEMO_CLINICS[0].name}
                      </th>
                      <th scope="col" className="px-4 py-3 font-black">
                        2 {ST_IVES_DEMO_CLINICS[1].name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-200">
                        <th
                          scope="row"
                          className="px-4 py-3 font-semibold text-[#0C1833]"
                        >
                          {row.criterion}
                        </th>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{row.clinic1}</p>
                          <p className="text-xs text-slate-600">
                            {row.clinic1Detail}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{row.clinic2}</p>
                          <p className="text-xs text-slate-600">
                            {row.clinic2Detail}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {whyTheseResults(doorMinimum)} Source: {ST_IVES_DEMO_SOURCE}.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-700">
                  Selected: {selectedClinic.name}. Next step: review access
                  notes or plan a trip in text.
                </p>
                <a
                  href="#results-region"
                  className={cn(
                    "inline-flex min-h-12 items-center rounded-xl bg-[#F8C51C] px-4 text-sm font-black text-[#0C1833]",
                    mapableCareFocusRing,
                  )}
                >
                  Review access notes
                </a>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-700">
              No synthetic results yet. Use Conversation search, AAC, or open{" "}
              <Link
                href="/search?presentation=conversation&tier=quick&demo=st-ives"
                className="font-semibold text-[#005B7F] underline"
              >
                the St Ives demo
              </Link>
              . Web mode uses public MapAble navigation when available.
            </div>
          )}
        </section>
      </div>

      {consentOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${baseId}-consent-title`}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h2
              id={`${baseId}-consent-title`}
              className="font-heading text-xl font-bold text-[#0C1833]"
            >
              Manage consent
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <strong>Preferences in use:</strong> Power chair, quiet spaces,
                doorway minimum {doorMinimum} mm (guest-adjustable for this
                search).
              </li>
              <li>
                <strong>Purpose:</strong> show synthetic access comparison for
                this demo search only.
              </li>
              <li>
                <strong>Sharing:</strong> this page does not send plan details,
                transcripts or precise location to advertising or the public
                search API.
              </li>
              <li>
                <strong>Withdraw:</strong> clear the draft, leave `/search`, or
                contact support to discuss account preferences.
              </li>
            </ul>
            <p className="mt-3 text-sm text-slate-600">
              Talk to a person via{" "}
              <Link href="/contact" className="font-semibold underline">
                /contact
              </Link>
              . Opening contact does not mean a person has received this
              conversation.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white",
                  mapableCareFocusRing,
                )}
                onClick={() => {
                  setConsentOpen(false);
                  consentTriggerRef.current?.focus();
                }}
              >
                Close
              </button>
              <Link
                href="/contact"
                className={cn(
                  "inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold",
                  mapableCareFocusRing,
                )}
              >
                Cancel handoff / contact
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
