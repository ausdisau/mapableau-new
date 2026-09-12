"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  ASK_MAPABLE_NAME,
  ASK_MAPABLE_SUBTITLE,
} from "@/lib/ask-mapable";

import type { AskWidgetTab } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  activeTab: AskWidgetTab;
  onTabChange: (tab: AskWidgetTab) => void;
  chat: React.ReactNode;
  actions: React.ReactNode;
  history: React.ReactNode;
};

const TABS: { id: AskWidgetTab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "actions", label: "Actions" },
  { id: "history", label: "History" },
];

export function AskMapAblePanel({
  open,
  onClose,
  activeTab,
  onTabChange,
  chat,
  actions,
  history,
}: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[46] flex items-end justify-end bg-black/40 p-0 sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="ask-mapable-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="ask-mapable-panel"
        className="flex h-[min(90vh,720px)] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-xl sm:rounded-2xl motion-reduce:transition-none"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 id={titleId} className="font-heading text-lg font-semibold">
              {ASK_MAPABLE_NAME}
            </h2>
            <p className="text-sm text-muted-foreground">{ASK_MAPABLE_SUBTITLE}</p>
            <p className="mt-1 text-xs text-muted-foreground" role="note">
              AI-assisted. MapAble remains usable without Ask MapAble.
            </p>
          </div>
          <Button
            ref={closeRef}
            type="button"
            variant="outline"
            size="default"
            className="min-h-11 min-w-11"
            aria-label="Close Ask MapAble"
            onClick={onClose}
          >
            Close
          </Button>
        </header>

        <div
          role="tablist"
          aria-label="Ask MapAble sections"
          className="flex gap-1 border-b border-border px-2 py-2"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`ask-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`ask-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const idx = TABS.findIndex((t) => t.id === activeTab);
                  const next =
                    e.key === "ArrowRight"
                      ? TABS[(idx + 1) % TABS.length]!
                      : TABS[(idx - 1 + TABS.length) % TABS.length]!;
                  onTabChange(next.id);
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div
            role="tabpanel"
            id="ask-panel-chat"
            aria-labelledby="ask-tab-chat"
            hidden={activeTab !== "chat"}
          >
            {chat}
          </div>
          <div
            role="tabpanel"
            id="ask-panel-actions"
            aria-labelledby="ask-tab-actions"
            hidden={activeTab !== "actions"}
          >
            {actions}
          </div>
          <div
            role="tabpanel"
            id="ask-panel-history"
            aria-labelledby="ask-tab-history"
            hidden={activeTab !== "history"}
          >
            {history}
          </div>
        </div>
      </div>
    </div>
  );
}
