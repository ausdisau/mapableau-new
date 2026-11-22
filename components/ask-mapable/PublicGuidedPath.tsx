"use client";

import Link from "next/link";
import { useReducer } from "react";

import {
  initialPublicGuide,
  PUBLIC_GUIDE_GOALS,
  reducePublicGuide,
  reviewPublicGuide,
} from "@/lib/ask-mapable/dialogue/public-guided-flow";

type Props = {
  onLeave?: () => void;
};

const buttonClass =
  "min-h-11 rounded-lg border border-border px-4 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryClass =
  "min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const inputClass =
  "min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * A no-AI pathway for anonymous visitors. State lives only in this mounted
 * component. No storage, analytics, model calls, geolocation or URL query
 * parameters are created from the user's choices.
 */
export function PublicGuidedPath({ onLeave }: Props) {
  const [state, dispatch] = useReducer(reducePublicGuide, undefined, initialPublicGuide);
  const review = reviewPublicGuide(state);
  const stepNumber = state.step === "goal" ? 1
    : state.step === "location" ? 2
    : state.step === "access" ? 3
    : 4;

  return (
    <section className="space-y-4" aria-labelledby="public-guided-heading">
      <div className="space-y-1">
        <h3 id="public-guided-heading" className="font-heading text-base font-semibold">
          Guided discovery, without AI
        </h3>
        <p className="text-xs text-muted-foreground">
          Choose your own route. These answers remain in this page until you leave or restart;
          they are not sent to a model, saved to an account, or added to a search URL.
        </p>
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          Step {stepNumber} of 4
        </p>
      </div>

      {state.step === "goal" ? (
        <fieldset className="space-y-3">
          <legend className="font-semibold">What would you like to explore?</legend>
          <div className="grid gap-2">
            {PUBLIC_GUIDE_GOALS.map((goal) => (
              <button
                key={goal.id}
                type="button"
                className={buttonClass + " bg-card hover:bg-accent"}
                onClick={() => dispatch({ type: "choose_goal", goal: goal.id })}
              >
                <span className="block font-semibold">{goal.label}</span>
                <span className="block text-xs text-muted-foreground">{goal.description}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {state.step === "location" ? (
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          dispatch({ type: "next" });
        }}>
          <label htmlFor="public-guide-location" className="block font-semibold">
            Is there a suburb or area you want to explore?
          </label>
          <p id="public-guide-location-hint" className="text-xs text-muted-foreground">
            Optional. A suburb or region is enough; you do not need to share a street address.
          </p>
          <input
            id="public-guide-location"
            type="text"
            autoComplete="off"
            maxLength={80}
            value={state.location}
            onChange={(event) => dispatch({ type: "set_location", value: event.target.value })}
            aria-describedby="public-guide-location-hint"
            placeholder="e.g. Parramatta, NSW"
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => dispatch({ type: "back" })}>
              Back
            </button>
            <button type="button" className={buttonClass} onClick={() => dispatch({ type: "skip" })}>
              Skip
            </button>
            <button type="submit" className={primaryClass}>Continue</button>
          </div>
        </form>
      ) : null}

      {state.step === "access" ? (
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          dispatch({ type: "next" });
        }}>
          <label htmlFor="public-guide-access" className="block font-semibold">
            Which access features matter to you?
          </label>
          <p id="public-guide-access-hint" className="text-xs text-muted-foreground">
            Optional. Describe a practical requirement such as step-free entry or AAC-friendly
            communication. Avoid diagnoses, health records, and identification details.
          </p>
          <textarea
            id="public-guide-access"
            rows={3}
            maxLength={160}
            value={state.access}
            onChange={(event) => dispatch({ type: "set_access", value: event.target.value })}
            aria-describedby="public-guide-access-hint"
            placeholder="e.g. step-free entry and clear written instructions"
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => dispatch({ type: "back" })}>
              Back
            </button>
            <button type="button" className={buttonClass} onClick={() => dispatch({ type: "skip" })}>
              Skip
            </button>
            <button type="submit" className={primaryClass}>Review choices</button>
          </div>
        </form>
      ) : null}

      {state.step === "review" && review ? (
        <div className="space-y-4">
          <h4 className="font-semibold">Review your choices</h4>
          <dl className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div>
              <dt className="font-semibold">Your goal</dt>
              <dd>{review.label}</dd>
            </div>
            {state.goal !== "human" ? (
              <>
                <div>
                  <dt className="font-semibold">Area</dt>
                  <dd>{review.location ?? "Not supplied"}
                    {" "}
                    <button
                      type="button"
                      className="ml-1 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
                      onClick={() => dispatch({ type: "edit", field: "location" })}
                    >
                      Edit area
                    </button>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Access features</dt>
                  <dd>{review.access ?? "Not supplied"}
                    {" "}
                    <button
                      type="button"
                      className="ml-1 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
                      onClick={() => dispatch({ type: "edit", field: "access" })}
                    >
                      Edit access features
                    </button>
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
          <p className="text-xs text-muted-foreground">
            Nothing has been checked, booked, or submitted. Current registration, individual
            worker screening, accessibility and availability remain unverified.
          </p>
          <p className="text-xs text-muted-foreground">
            Opening the page below does not transfer your optional answers. You can choose
            what to enter into its search fields yourself.
          </p>
          <Link
            className={primaryClass + " inline-flex items-center justify-center"}
            href={review.href}
            onClick={onLeave}
          >
            {review.actionLabel}
          </Link>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => dispatch({ type: "back" })}>
              Back
            </button>
            <button type="button" className={buttonClass} onClick={() => dispatch({ type: "restart" })}>
              Start again
            </button>
          </div>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Prefer not to use this guide? <Link href="/contact" className="underline" onClick={onLeave}>
          Contact MapAble directly
        </Link>.
      </p>
    </section>
  );
}
