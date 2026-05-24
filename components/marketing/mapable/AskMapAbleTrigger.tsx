"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  MAPABLE_SUPPORT_EMAIL,
  MAPABLE_SUPPORT_PHONE,
  MAPABLE_SUPPORT_PHONE_HREF,
} from "@/lib/brand/constants";

import { MapAbleButton } from "./MapAbleButton";

type AskMapAbleTriggerProps = {
  className?: string;
  label?: string;
  context?: string;
  variant?: "button" | "link";
};

/**
 * Opens guided support panel or routes to /ask — no auto-escalation to Chatwoot or AI.
 */
export function AskMapAbleTrigger({
  className,
  label = "Ask MapAble",
  context,
  variant = "button",
}: AskMapAbleTriggerProps) {
  const [open, setOpen] = useState(false);

  const askHref = context
    ? `/ask?context=${encodeURIComponent(context)}`
    : "/ask";

  if (variant === "link") {
    return (
      <Link
        href={askHref}
        className={cn(
          "mapable-focus-ring inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-mapable-blue hover:underline",
          className,
        )}
      >
        {label}
      </Link>
    );
  }

  return (
    <>
      <MapAbleButton
        type="button"
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="ask-mapable-panel"
      >
        {label}
      </MapAbleButton>
      {open ? (
        <div
          id="ask-mapable-panel"
          role="dialog"
          aria-labelledby="ask-mapable-title"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-mapable-navy/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ask-mapable-title" className="mapable-display text-xl font-bold text-mapable-navy">
              Ask MapAble
            </h2>
            <p className="mapable-soft mt-2 text-sm text-slate-600">
              Get guided help comparing options. We will not send NDIS or health documents
              anywhere without your confirmation.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <MapAbleButton href={askHref} variant="primary" onClick={() => setOpen(false)}>
                Open guidance assistant
              </MapAbleButton>
              <MapAbleButton
                href="/support"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Talk to MapAble support
              </MapAbleButton>
            </div>
            <p className="mapable-soft mt-4 text-xs text-slate-500">
              Or contact us:{" "}
              <a href={`mailto:${MAPABLE_SUPPORT_EMAIL}`} className="text-mapable-blue underline">
                {MAPABLE_SUPPORT_EMAIL}
              </a>
              {" · "}
              <a href={MAPABLE_SUPPORT_PHONE_HREF} className="text-mapable-blue underline">
                {MAPABLE_SUPPORT_PHONE}
              </a>
            </p>
            <button
              type="button"
              className="mapable-focus-ring mt-4 w-full min-h-11 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
