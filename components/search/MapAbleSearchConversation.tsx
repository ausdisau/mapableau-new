"use client";

import Link from "next/link";
import React, { useId, useReducer, useState } from "react";

import { cn } from "@/app/lib/utils";
import { GuidedSearchDialogue } from "@/components/guided-search/GuidedSearchDialogue";
import { MapAbleSearchDisclosure } from "@/components/search/MapAbleSearchDisclosure";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapableSearchInputClass } from "@/lib/brand/styles";
import {
  PUBLIC_GUIDE_GOALS,
  initialPublicGuide,
  reducePublicGuide,
  reviewPublicGuide,
  type PublicGuideGoal,
} from "@/lib/search/public-guided-flow";
import type { GuidedSearchSessionFields } from "@/components/guided-search/types";

type Props = {
  className?: string;
};

const emptySession: GuidedSearchSessionFields = {
  query: "",
  location: "",
  providerName: "",
  serviceQuery: "",
  accessQuery: "",
};

export function MapAbleSearchConversation({ className }: Props) {
  const baseId = useId();
  const [guide, dispatch] = useReducer(
    reducePublicGuide,
    undefined,
    initialPublicGuide,
  );
  const [aiConsented, setAiConsented] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [session, setSession] =
    useState<GuidedSearchSessionFields>(emptySession);
  const review = reviewPublicGuide(guide);

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className={cn(
        "space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="space-y-1">
        <h2
          id={`${baseId}-heading`}
          className="font-heading text-xl font-bold text-[#0C1833]"
        >
          Conversation guide
        </h2>
        <p className="text-sm text-slate-600">
          A step-by-step path that never sends your answers to an AI model.
          Optional online assistant stays behind an explicit choice.
        </p>
      </div>

      {guide.step === "goal" ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-black text-[#0C1833]">
            What do you want to explore?
          </legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {PUBLIC_GUIDE_GOALS.map((goal) => (
              <li key={goal.id}>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "choose_goal",
                      goal: goal.id as PublicGuideGoal,
                    })
                  }
                  className={cn(
                    "flex min-h-14 w-full flex-col items-start rounded-xl border border-slate-200 bg-[#F6FBFC] px-4 py-3 text-left transition hover:border-[#005B7F]",
                    mapableCareFocusRing,
                  )}
                >
                  <span className="font-black text-[#0C1833]">
                    {goal.label}
                  </span>
                  <span className="mt-1 text-xs text-slate-600">
                    {goal.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      {guide.step === "location" ? (
        <div className="space-y-3">
          <label
            htmlFor={`${baseId}-location`}
            className="block text-sm font-black text-[#0C1833]"
          >
            Area (optional)
          </label>
          <input
            id={`${baseId}-location`}
            type="text"
            value={guide.location}
            onChange={(event) =>
              dispatch({ type: "set_location", value: event.target.value })
            }
            className={mapableSearchInputClass}
            placeholder="Suburb or city — kept on this device only"
            maxLength={80}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "back" })}
              className={cn(
                "min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black",
                mapableCareFocusRing,
              )}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "skip" })}
              className={cn(
                "min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black",
                mapableCareFocusRing,
              )}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "next" })}
              className={cn(
                "min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white",
                mapableCareFocusRing,
              )}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {guide.step === "access" ? (
        <div className="space-y-3">
          <label
            htmlFor={`${baseId}-access`}
            className="block text-sm font-black text-[#0C1833]"
          >
            Access needs (optional)
          </label>
          <textarea
            id={`${baseId}-access`}
            value={guide.access}
            onChange={(event) =>
              dispatch({ type: "set_access", value: event.target.value })
            }
            className={cn(mapableSearchInputClass, "min-h-24 resize-y")}
            placeholder="e.g. step-free entry — not saved without your consent"
            maxLength={160}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "back" })}
              className={cn(
                "min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black",
                mapableCareFocusRing,
              )}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "skip" })}
              className={cn(
                "min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black",
                mapableCareFocusRing,
              )}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "next" })}
              className={cn(
                "min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white",
                mapableCareFocusRing,
              )}
            >
              Review
            </button>
          </div>
        </div>
      ) : null}

      {review ? (
        <div className="space-y-3 rounded-2xl border border-[#00A979]/30 bg-[#F6FBFC] p-4">
          <h3 className="font-heading text-lg font-bold text-[#0C1833]">
            {review.label}
          </h3>
          <p className="text-sm text-slate-700">{review.description}</p>
          {review.location ? (
            <p className="text-sm">
              <span className="font-semibold">Area noted:</span>{" "}
              {review.location} (not added to the link)
            </p>
          ) : null}
          {review.access ? (
            <p className="text-sm">
              <span className="font-semibold">Access noted:</span>{" "}
              {review.access} (not added to the link)
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              href={review.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white",
                mapableCareFocusRing,
              )}
            >
              {review.actionLabel}
            </Link>
            <button
              type="button"
              onClick={() => dispatch({ type: "back" })}
              className={cn(
                "min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black",
                mapableCareFocusRing,
              )}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "restart" })}
              className={cn(
                "min-h-11 rounded-xl px-4 text-sm font-black text-[#005B7F] underline",
                mapableCareFocusRing,
              )}
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <MapAbleSearchDisclosure showAiNotice />
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-[#0C1833]">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-slate-300"
            checked={aiConsented}
            onChange={(event) => {
              setAiConsented(event.target.checked);
              if (!event.target.checked) setShowAiPanel(false);
            }}
          />
          <span>
            I understand my message may be processed by MapAble&apos;s online
            assistant, and I choose to continue.
          </span>
        </label>
        <button
          type="button"
          disabled={!aiConsented}
          onClick={() => setShowAiPanel(true)}
          className={cn(
            "inline-flex min-h-11 items-center rounded-xl border-2 border-[#005B7F] px-4 text-sm font-black text-[#005B7F] disabled:cursor-not-allowed disabled:opacity-50",
            mapableCareFocusRing,
          )}
        >
          Use online assistant
        </button>
        {showAiPanel && aiConsented ? (
          <div className="rounded-2xl border border-slate-200 p-3">
            <GuidedSearchDialogue
              session={session}
              onSessionChange={setSession}
              onInterpretation={() => undefined}
              variant="compact"
              showHeader
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
