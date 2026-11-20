"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import { LazyMapPanel } from "@/components/map/LazyMapPanel";
import type { DirectoryViewMode } from "@/components/map/LazyMapPanel";

export type ChatFirstMobilePane = "chat" | "results" | "map";

type Props = {
  chat: ReactNode;
  chips?: ReactNode;
  list: ReactNode;
  map: ReactNode;
  searchSubmitted: boolean;
  hasMatches: boolean;
  className?: string;
};

export function ChatFirstFinderExperience({
  chat,
  chips,
  list,
  map,
  searchSubmitted,
  hasMatches,
  className,
}: Props) {
  const [mobilePane, setMobilePane] = useState<ChatFirstMobilePane>("chat");
  const [resultsView, setResultsView] = useState<DirectoryViewMode>("list");
  const baseId = useId().replace(/:/g, "");
  const chatPanelId = `chat-first-chat-${baseId}`;
  const resultsPanelId = `chat-first-results-${baseId}`;
  const mapPanelId = `chat-first-map-${baseId}`;

  function selectPane(pane: ChatFirstMobilePane) {
    setMobilePane(pane);
    if (pane === "map") setResultsView("map");
    if (pane === "results") setResultsView("list");
  }

  return (
    <div
      data-testid="chat-first-finder"
      className={cn("container mx-auto max-w-7xl px-4 py-6", className)}
    >
      <div
        role="tablist"
        aria-label="Provider finder views"
        className="mb-4 flex gap-2 lg:hidden"
      >
        {(
          [
            ["chat", "Chat", chatPanelId],
            ["results", "Results", resultsPanelId],
            ["map", "Map", mapPanelId],
          ] as const
        ).map(([id, label, panelId]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`chat-first-tab-${id}-${baseId}`}
            aria-selected={mobilePane === id}
            aria-controls={panelId}
            className={cn(
              "min-h-11 flex-1 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mobilePane === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background",
            )}
            onClick={() => selectPane(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <section
          id={chatPanelId}
          data-testid="chat-first-chat-panel"
          role="tabpanel"
          aria-labelledby={`chat-first-tab-chat-${baseId}`}
          className={cn(
            "min-h-[24rem]",
            mobilePane !== "chat" && "max-lg:hidden",
          )}
        >
          {chat}
        </section>

        <section className="min-w-0 space-y-4">
          {chips}
          <div
            id={resultsPanelId}
            role="tabpanel"
            aria-labelledby={`chat-first-tab-results-${baseId}`}
            className={cn(mobilePane === "map" && "max-lg:hidden")}
          >
            {!searchSubmitted ? (
              <p className="text-sm text-muted-foreground" role="status">
                Describe what you need in chat, or use Search without chat. The
                map is optional and does not replace this list.
              </p>
            ) : null}
            <div className="max-lg:hidden">
              <LazyMapPanel
                view={resultsView}
                onViewChange={setResultsView}
                resultsPanelId={`${resultsPanelId}-desktop`}
                listLabel="Show provider directory as a list"
                mapLabel="Show providers on an interactive map"
                statusMessage={
                  resultsView === "map"
                    ? "Map view is optional. The list remains available."
                    : hasMatches
                      ? "List view of imported directory matches."
                      : searchSubmitted
                        ? "No matching providers in this snapshot."
                        : "List waiting for a search."
                }
                list={list}
                map={map}
              />
            </div>
            <div className="lg:hidden">{list}</div>
          </div>
          <div
            id={mapPanelId}
            role="tabpanel"
            aria-labelledby={`chat-first-tab-map-${baseId}`}
            className={cn("lg:hidden", mobilePane !== "map" && "hidden")}
          >
            {mobilePane === "map" ? map : null}
          </div>
        </section>
      </div>
    </div>
  );
}
