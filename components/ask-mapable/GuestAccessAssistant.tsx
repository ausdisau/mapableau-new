"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { GuidedSearchDialogue } from "@/components/guided-search/GuidedSearchDialogue";
import type { GuidedSearchSessionFields } from "@/components/guided-search/types";
import { isPublicAccessAssistantRoute } from "@/lib/ask-mapable/public-guest-policy";
import type { FinderInterpretationData } from "@/types/provider-finder-chat";

import { AskMapAbleLauncher } from "./AskMapAbleLauncher";
import { AskMapAblePanel } from "./AskMapAblePanel";
import { PublicGuidedPath } from "./PublicGuidedPath";
import type { AskWidgetTab } from "./types";

const EMPTY_FINDER: GuidedSearchSessionFields = {
  query: "",
  location: "",
  providerName: "",
  serviceQuery: "",
  accessQuery: "",
};

const PUBLIC_ACTIONS = [
  { href: "/access", label: "Explore accessible places", detail: "Review reported and verified access information." },
  { href: "/provider-finder", label: "Find a support provider", detail: "Inspect directory evidence before making contact." },
  { href: "/transport", label: "Explore transport", detail: "Check your access requirements before making plans." },
  { href: "/employment", label: "Explore inclusive jobs", detail: "Read about employment pathways and adjustments." },
  { href: "/contact", label: "Talk to a person", detail: "Contact MapAble directly without an AI conversation." },
] as const;

function getPublicStarters(pathname: string): string[] {
  if (pathname.startsWith("/transport")) {
    return [
      "Help me find accessible transport in Sydney",
      "How can I compare transport support providers?",
      "Find an accessible travel service in NSW",
    ];
  }
  if (pathname.startsWith("/access") || pathname.startsWith("/places")) {
    return [
      "Find an accessible place in Sydney",
      "Find services with communication access support",
      "How can I check a provider's accessibility information?",
    ];
  }
  return [
    "Find an NDIS support provider in Parramatta",
    "Find a provider supporting AAC communication in NSW",
    "Explore accessible transport services near Newcastle",
  ];
}

/**
 * Anonymous, discovery-only companion.
 *
 * Reuses the existing provider finder dialogue and its server endpoint.
 * NEVER calls the authenticated /api/mapable/ask endpoint, stores participant
 * data, imports logged-in session history, books supports or makes payments.
 *
 * The browser session identifier used by GuidedSearchDialogue is still an
 * existing public Provider Finder session; see privacy review in the ADR.
 */
export function GuestAccessAssistant() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AskWidgetTab>("chat");
  const [discoveryMode, setDiscoveryMode] = useState<"guided" | "conversation">("guided");
  const [chatApproved, setChatApproved] = useState(false);
  const [finderSession, setFinderSession] = useState<GuidedSearchSessionFields>(
    () => ({ ...EMPTY_FINDER }),
  );
  const closePanel = useCallback(() => setOpen(false), []);
  const togglePanel = useCallback(() => setOpen((value) => !value), []);

  const starterPrompts = useMemo(() => getPublicStarters(pathname), [pathname]);

  const onInterpretation = useCallback((data: FinderInterpretationData) => {
    setFinderSession({
      query: data.applied.query,
      location: data.applied.location,
      providerName: data.applied.providerName,
      serviceQuery: data.applied.serviceQuery,
      accessQuery: data.applied.accessQuery,
    });
  }, []);

  if (!isPublicAccessAssistantRoute(pathname)) return null;

  return (
    <>
      <AskMapAbleLauncher open={open} onToggle={togglePanel} />
      <AskMapAblePanel
        open={open}
        onClose={closePanel}
        activeTab={activeTab}
        onTabChange={(next) => setActiveTab(next === "actions" ? "actions" : "chat")}
        showHistory={false}
        history={null}
        chat={
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Welcome. Explore services and access information at your own pace.
              This public mode cannot access accounts, make bookings, or confirm worker screening.
            </p>
            <div role="group" aria-label="Choose how to explore" className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  discoveryMode === "guided"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                }`}
                aria-pressed={discoveryMode === "guided"}
                onClick={() => {
                  setDiscoveryMode("guided");
                  setChatApproved(false);
                }}
              >
                Guided steps (no AI)
              </button>
              <button
                type="button"
                className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  discoveryMode === "conversation"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                }`}
                aria-pressed={discoveryMode === "conversation"}
                onClick={() => setDiscoveryMode("conversation")}
              >
                Ask a question
              </button>
            </div>
            {discoveryMode === "guided" ? (
              <PublicGuidedPath onLeave={closePanel} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm">
                  Public conversational search uses MapAble's existing guided search service.
                  Questions are sent to that server and may be processed by an external AI provider.
                  Please avoid sharing diagnoses, health records or identifying details.
                </p>
                <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={chatApproved}
                    className="mt-1 size-4 accent-primary"
                    onChange={(event) => setChatApproved(event.target.checked)}
                  />
                  <span>
                    I choose to use the online conversational search service in this session.
                    I can return to the no-AI guide at any time.
                  </span>
                </label>
                {chatApproved ? (
                  <GuidedSearchDialogue
                    variant="compact"
                    session={finderSession}
                    onSessionChange={setFinderSession}
                    onInterpretation={onInterpretation}
                    onShowResults={closePanel}
                    starterPrompts={starterPrompts}
                    className="min-h-0"
                  />
                ) : (
                  <p role="status" className="text-xs text-muted-foreground">
                    Select the checkbox to open conversational search, or choose the no-AI guide.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Directory records cannot confirm current NDIS registration, worker screening,
                  access fit or availability. Verify all essential requirements independently.
                </p>
              </div>
            )}
          </div>
        }
        actions={
          <div className="space-y-3">
            <p className="text-sm">Choose where to continue. All actions below open a public page.</p>
            <ul className="space-y-2">
              {PUBLIC_ACTIONS.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="block min-h-11 rounded-lg border border-border bg-card px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setOpen(false)}
                  >
                    <span className="block font-semibold text-primary">{action.label}</span>
                    <span className="block text-sm text-muted-foreground">{action.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              To use your private MapAble records, sign in and use the authorised assistant
              where it is enabled. No public chat content is transferred automatically.
            </p>
          </div>
        }
      />
    </>
  );
}
