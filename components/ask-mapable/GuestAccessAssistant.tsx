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
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Welcome. I can help you explore services and accessibility information.
              This public mode does not access participant accounts or make bookings.
            </p>
            <GuidedSearchDialogue
              variant="compact"
              session={finderSession}
              onSessionChange={setFinderSession}
              onInterpretation={onInterpretation}
              onShowResults={closePanel}
              starterPrompts={starterPrompts}
              className="min-h-0"
            />
            <p className="text-xs text-muted-foreground">
              Directory listings do not confirm current NDIS registration, worker screening,
              accessibility or availability. Please verify details before relying on a result.
            </p>
            <p className="text-xs text-muted-foreground">
              Please avoid sharing health records or private identification information.
              Search messages use MapAble's existing guided search service.
            </p>
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
