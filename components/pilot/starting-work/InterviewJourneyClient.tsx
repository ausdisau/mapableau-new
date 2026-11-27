"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  buildInterviewHandoffReceipt,
  interviewJourneyFixture,
  type InterviewHandoffReceipt,
  type PickupPreference,
} from "@/lib/pilot/starting-work/interview-journey-fixture";

type EvidenceView = "map_list" | "list_only";

const cream = "#F7F1E8";
const navy = "#0C1833";
const teal = "#005B7F";
const gold = "#F8C51C";

export function InterviewJourneyClient() {
  const fixture = interviewJourneyFixture;
  const meaningId = useId();
  const messageId = useId();
  const formModeId = useId();

  const [addedMessage, setAddedMessage] = useState("");
  const [suggestedMeaning, setSuggestedMeaning] = useState(fixture.suggestedMeaning);
  const [confirmedMeaning, setConfirmedMeaning] = useState<string | null>(null);
  const [meaningError, setMeaningError] = useState<string | null>(null);
  const [useForm, setUseForm] = useState(false);
  const [evidenceView, setEvidenceView] = useState<EvidenceView>("map_list");
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>("before_leaving");
  const [pickupPreference, setPickupPreference] = useState<PickupPreference>("keep_on_hold");
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    original_words: false,
    added_message: false,
    pickup_preference: false,
  });
  const [receipt, setReceipt] = useState<InterviewHandoffReceipt | null>(null);
  const [statusAnn, setStatusAnn] = useState("");

  const handoffTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (handoffOpen) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      const first = dialog.querySelector<HTMLElement>(
        "button, [href], input, select, textarea",
      );
      first?.focus();
      return;
    }
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    handoffTriggerRef.current?.focus();
  }, [handoffOpen]);

  function invalidateConfirmation() {
    if (confirmedMeaning !== null) {
      setConfirmedMeaning(null);
      setStatusAnn("Meaning confirmation cleared because the draft changed.");
    }
  }

  function onConfirmMeaning() {
    const draft = suggestedMeaning.trim();
    if (!draft) {
      setMeaningError("Enter a suggested meaning before confirming.");
      return;
    }
    setMeaningError(null);
    setConfirmedMeaning(draft);
    setStatusAnn("Meaning confirmed for review.");
  }

  function toggleField(id: string) {
    setSelectedFields((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function simulateHandoff() {
    const selectedFieldIds = Object.entries(selectedFields)
      .filter(([, on]) => on)
      .map(([id]) => id);
    const next = buildInterviewHandoffReceipt({
      confirmedMeaning,
      addedMessage,
      pickupPreference,
      selectedFieldIds,
    });
    setReceipt(next);
    setHandoffOpen(false);
    setStatusAnn("Handoff receipt saved locally in this demo.");
  }

  return (
    <div className="space-y-8 text-[color:var(--interview-navy,#0C1833)]" style={{ ["--interview-navy" as string]: navy }}>
      <p className="sr-only" role="status" aria-live="polite">
        {statusAnn}
      </p>

      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          {fixture.scenarioLabel}
        </p>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl" style={{ color: navy }}>
          {fixture.title}
        </h1>
        <p className="text-lg text-slate-700">{fixture.situationSummary}</p>
        <ul className="flex flex-wrap gap-2 text-sm" aria-label="Plan pieces">
          <li className="rounded-md border border-slate-300 px-3 py-2">Interview: scheduled</li>
          <li className="rounded-md border border-slate-300 px-3 py-2">
            Care replacement: needs review
          </li>
          <li className="rounded-md border px-3 py-2" style={{ borderColor: gold, background: cream }}>
            Pickup: on hold
          </li>
        </ul>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="your-words-heading"
          className="space-y-4 rounded-2xl border border-slate-200 p-5"
          style={{ background: cream }}
        >
          <h2 id="your-words-heading" className="font-heading text-2xl font-bold">
            Your words
          </h2>
          <blockquote className="border-l-4 pl-4 text-base" style={{ borderColor: teal }}>
            <p className="font-medium">{fixture.exampleMessage}</p>
          </blockquote>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-400 px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-pressed={!useForm}
              onClick={() => setUseForm(false)}
            >
              Add a message
            </button>
            <button
              type="button"
              id={formModeId}
              className="min-h-11 rounded-lg border border-slate-400 px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-pressed={useForm}
              onClick={() => setUseForm(true)}
            >
              Use a form
            </button>
          </div>

          <label className="block space-y-1 text-sm font-semibold" htmlFor={messageId}>
            {useForm ? "Message (form)" : "Add a message"}
            <textarea
              id={messageId}
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-base font-normal"
              value={addedMessage}
              onChange={(e) => {
                setAddedMessage(e.target.value);
                invalidateConfirmation();
              }}
              placeholder="Type or paste from AAC"
            />
          </label>

          <label className="block space-y-1 text-sm font-semibold" htmlFor={meaningId}>
            Suggested meaning
            <input
              id={meaningId}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal"
              value={suggestedMeaning}
              onChange={(e) => {
                setSuggestedMeaning(e.target.value);
                invalidateConfirmation();
                if (meaningError) setMeaningError(null);
              }}
              aria-invalid={Boolean(meaningError)}
              aria-describedby={meaningError ? `${meaningId}-error` : undefined}
            />
          </label>
          {meaningError ? (
            <p id={`${meaningId}-error`} role="alert" className="text-sm text-red-800">
              {meaningError}
            </p>
          ) : null}

          <button
            type="button"
            className="min-h-11 rounded-lg px-5 font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: teal }}
            onClick={onConfirmMeaning}
          >
            Confirm meaning
          </button>
          {confirmedMeaning ? (
            <p className="text-sm font-medium text-slate-800">
              Confirmed: {confirmedMeaning}
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              Time spent composing leaves the request pending until you confirm.
            </p>
          )}
        </section>

        <section aria-labelledby="journey-details-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="journey-details-heading" className="font-heading text-2xl font-bold">
              Journey details
            </h2>
            <div className="flex gap-2" role="group" aria-label="Evidence presentation">
              <button
                type="button"
                className="min-h-11 rounded-lg border px-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-pressed={evidenceView === "map_list"}
                onClick={() => setEvidenceView("map_list")}
              >
                Map and list
              </button>
              <button
                type="button"
                className="min-h-11 rounded-lg border px-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-pressed={evidenceView === "list_only"}
                onClick={() => setEvidenceView("list_only")}
              >
                List only
              </button>
            </div>
          </div>

          {evidenceView === "map_list" ? (
            <figure
              className="rounded-2xl border border-dashed border-slate-400 bg-slate-50 p-4"
              aria-label="Illustrative proposed route"
            >
              <figcaption className="mb-3 text-sm text-slate-600">
                Illustrative route (map image unavailable in this build — list remains usable).
              </figcaption>
              <ul className="flex flex-wrap gap-2">
                {fixture.evidence.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="min-h-11 rounded-full border border-slate-400 bg-white px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      onClick={() => setOpenEvidenceId(item.id)}
                      aria-controls={`evidence-${item.id}`}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </figure>
          ) : null}

          <ul className="space-y-3">
            {fixture.evidence.map((item) => {
              const open = openEvidenceId === item.id;
              return (
                <li
                  key={item.id}
                  id={`evidence-${item.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-expanded={open}
                    onClick={() => setOpenEvidenceId(open ? null : item.id)}
                  >
                    <span className="font-heading text-lg font-bold">{item.title}</span>
                    <span className="text-sm font-semibold text-slate-700">{item.statusLabel}</span>
                  </button>
                  {open ? (
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <p>{item.detail}</p>
                      <p>
                        <strong>Uncertainty:</strong> {item.uncertainty}
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section aria-labelledby="pickup-heading" className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <h2 id="pickup-heading" className="font-heading text-2xl font-bold">
          Review pickup options
        </h2>
        <p className="text-slate-700">
          The ride continues to display as on hold. Linked transport stays in its existing domain
          state.
        </p>
        <fieldset className="space-y-2">
          <legend className="sr-only">Pickup preference</legend>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="radio"
              name="pickup"
              checked={pickupPreference === "keep_on_hold"}
              onChange={() => setPickupPreference("keep_on_hold")}
            />
            Keep current pickup on hold
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="radio"
              name="pickup"
              checked={pickupPreference === "ask_different"}
              onChange={() => setPickupPreference("ask_different")}
            />
            Ask about a different pickup
          </label>
        </fieldset>
        <p className="text-sm text-slate-600" role="status">
          Saved in this demo:{" "}
          {pickupPreference === "keep_on_hold"
            ? "keep current pickup on hold"
            : "ask about a different pickup"}
          .
        </p>
      </section>

      <section aria-labelledby="handoff-heading" className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <h2 id="handoff-heading" className="font-heading text-2xl font-bold">
          Review a handoff
        </h2>
        <button
          ref={handoffTriggerRef}
          type="button"
          className="min-h-11 rounded-lg px-5 font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: teal }}
          onClick={() => setHandoffOpen(true)}
        >
          Ask my coordinator
        </button>
        {receipt ? (
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm" role="status">
            <p className="font-semibold">Local handoff receipt</p>
            <p>To: {receipt.recipientLabel}</p>
            <p>Purpose: {receipt.purpose}</p>
            <p>Message: {receipt.message}</p>
            <p>
              Selected fields:{" "}
              {receipt.selectedFieldIds.length
                ? receipt.selectedFieldIds.join(", ")
                : "none (generic help request)"}
            </p>
          </div>
        ) : null}
      </section>

      <dialog
        ref={dialogRef}
        className="w-[min(100%,32rem)] rounded-2xl border border-slate-300 p-0 shadow-lg backdrop:bg-black/40"
        onClose={() => setHandoffOpen(false)}
        aria-labelledby="handoff-dialog-title"
      >
        <form method="dialog" className="space-y-4 p-5" onSubmit={(e) => e.preventDefault()}>
          <h3 id="handoff-dialog-title" className="font-heading text-xl font-bold">
            Ask my coordinator
          </h3>
          <p className="text-sm text-slate-700">
            Recipient: {fixture.coordinator.recipientLabel}. Purpose: {fixture.coordinator.purpose}.
          </p>
          <p className="text-sm text-slate-700">
            Proposed message:{" "}
            {confirmedMeaning?.trim() ||
              "Please help me recover my interview support plan. (Generic — draft text omitted until you confirm meaning.)"}
          </p>
          <fieldset className="space-y-2">
            <legend className="font-semibold">Include fields (all start unchecked)</legend>
            {fixture.coordinator.proposedFields.map((field) => (
              <label key={field.id} className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(selectedFields[field.id])}
                  onChange={() => toggleField(field.id)}
                />
                {field.label}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg px-4 font-bold text-white"
              style={{ background: teal }}
              onClick={simulateHandoff}
            >
              Simulate handoff
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-400 px-4 font-semibold"
              onClick={() => setHandoffOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
