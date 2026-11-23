"use client";

import { useRef, useState } from "react";

import { useSearchWorkspace } from "@/mobile-contracts/search/use-search-workspace";
import {
  audit,
  clinics,
  comparison,
  exampleAnswer,
  parseWidth,
  phrases,
  topics,
  views,
  visibleClinics,
  type Scope,
} from "@/mobile-contracts/search/workspace";

import { FloorPlan, StreetMap } from "./SpatialEvidence";
import styles from "./workspace.module.css";

export function SearchWorkspace() {
  const { state, dispatch, selected, browse, directory, retry } =
    useSearchWorkspace("");
  const [large, setLarge] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [easy, setEasy] = useState(false);
  const [width, setWidth] = useState("");
  const [error, setError] = useState("");
  const [voice, setVoice] = useState(false);
  const [handoff, setHandoff] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const consent = useRef<HTMLDetailsElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const visible = visibleClinics(state);
  const matches = clinics.filter(
    (c) => state.minimum !== null && c.door >= state.minimum,
  ).length;
  const count =
    state.minimum === null
      ? "2 clinics · No minimum applied"
      : matches +
        (matches === 1 ? " match" : " matches") +
        " · " +
        (2 - matches) +
        " below minimum";
  const status = state.demo
    ? count +
      (selected ? " · Selected clinic " + selected.id : " · No clinic selected")
    : browse
      ? directory
        ? directory.error
          ? "Public directory unavailable."
          : directory.hits.length + " public pathways"
        : "Loading public pathways…"
      : "";
  const answer = state.demo
    ? selected
      ? exampleAnswer(state.question, selected, state.minimum, easy)
      : "No example door meets this width. Show alternatives to compare them."
    : "Review the public pathways for " +
      state.scope.toLowerCase() +
      ". You can also explore the fictional St Ives example.";
  function loadExample() {
    dispatch({ type: "example" });
    document.getElementById("results")?.focus();
    setWidth("900");
    setError("");
  }
  function reset() {
    dispatch({ type: "reset" });
    input.current?.focus();
    setWidth("");
    setError("");
    setHandoff("");
    setCopyStatus("");
    setVoice(false);
  }
  return (
    <main
      lang="en-AU"
      className={styles.shell}
      data-large={large}
      data-contrast={contrast}
    >
      <nav className={styles.utility} aria-label="Shortcuts">
        <a href="#composer">Skip to search</a>
        <a href="#results">Skip to results</a>
        <span>
          In an emergency, call <a href="tel:000">000</a>
        </span>
      </nav>
      <header className={styles.header}>
        <img
          src="/search-example/search-wordmark.png"
          alt="MapAble Search"
          width="205"
          height="48"
        />
        <div className={styles.controls}>
          <a
            href="#preferences"
            onClick={() => {
              if (consent.current) consent.current.open = true;
            }}
          >
            Access preferences
          </a>
          <button aria-pressed={large} onClick={() => setLarge(!large)}>
            Large text
          </button>
          <button
            aria-pressed={contrast}
            onClick={() => setContrast(!contrast)}
          >
            High contrast
          </button>
          <button aria-pressed={easy} onClick={() => setEasy(!easy)}>
            Easy read
          </button>
          <a href="#support">Talk to a person</a>
        </div>
      </header>
      <div className={styles.grid}>
        <section className={styles.chat} aria-labelledby="chat-title">
          <h1 id="chat-title">Find what works for you.</h1>
          <p>
            {easy
              ? "Ask a question. Choose how to see the answer."
              : "One search. An accessible Australia."}
          </p>
          <div
            className={styles.controls}
            role="group"
            aria-label="Presentation"
          >
            {(["Conversation", "Web"] as const).map((mode) => (
              <button
                key={mode}
                aria-pressed={state.presentation === mode}
                onClick={() => dispatch({ type: "presentation", value: mode })}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className={styles.controls}>
            <span>Quick · Free</span>
            <span>Deep search unavailable</span>
          </div>
          <label>
            Search scope{" "}
            <select
              value={state.scope}
              onChange={(e) => {
                dispatch({ type: "scope", value: e.target.value as Scope });
                setWidth("");
                setError("");
              }}
            >
              {Object.keys(topics).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {state.demo && (
            <p className={styles.disclosure}>
              Synthetic demo · Both clinics, measurements, routes and checks are
              fictional.
            </p>
          )}
          {state.question && state.presentation === "Conversation" && (
            <div className={styles.thread}>
              <div>
                <b>You</b>
                <p>{state.question}</p>
              </div>
              <div>
                <b>MapAble</b>
                <p>{answer}</p>
              </div>
            </div>
          )}
          {state.presentation === "Web" && (
            <p>Browse public pathways by topic. Your draft stays here.</p>
          )}
          <section aria-label="AAC quick phrases">
            <h2>Add a phrase</h2>
            <div className={styles.phrases}>
              {phrases.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    dispatch({ type: "phrase", value: p });
                    input.current?.focus();
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "submit" });
            }}
          >
            <label htmlFor="composer">Ask MapAble</label>
            <textarea
              ref={input}
              id="composer"
              rows={2}
              maxLength={600}
              placeholder="Search places, services, transport, jobs…"
              value={state.draft}
              onChange={(e) =>
                dispatch({ type: "draft", value: e.target.value })
              }
            />
            <div className={styles.controls}>
              <button
                type="button"
                aria-expanded={voice}
                onClick={() => setVoice(!voice)}
              >
                Voice input options
              </button>
              <button className={styles.primary} disabled={!state.draft.trim()}>
                Send
              </button>
            </div>
            {voice && (
              <p>
                Choose dictation on your own keyboard if you use it. Its privacy
                settings depend on your device. Edit the words here, then choose
                Send. You can also type or use AAC.
              </p>
            )}
          </form>
          <details ref={consent}>
            <summary id="preferences">
              Manage consent and access preferences
            </summary>
            <p>
              Your conversation stays in this tab. Only the chosen public topic
              is sent when browsing pathways. Sharing with support is off.
            </p>
            {state.demo && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const minimum = parseWidth(width);
                  if (minimum === undefined) {
                    setError("Enter a whole number from 1 to 9999 mm.");
                    return;
                  }
                  dispatch({ type: "minimum", value: minimum });
                  setError("");
                }}
              >
                <label htmlFor="door-width">
                  Doorway minimum in millimetres
                </label>
                <input
                  id="door-width"
                  type="text"
                  inputMode="numeric"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? "width-error" : undefined}
                />
                <div className={styles.controls}>
                  <button>Apply minimum</button>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "minimum", value: null });
                      setWidth("");
                      setError("");
                    }}
                  >
                    Remove minimum
                  </button>
                </div>
                {error && (
                  <p id="width-error" role="alert">
                    {error}
                  </p>
                )}
              </form>
            )}
            <button onClick={reset}>Clear this search and draft</button>
          </details>
          <section aria-labelledby="support" className={styles.support}>
            <h2 id="support" tabIndex={-1}>
              Talk to a person
            </h2>
            <details
              onToggle={(e) => {
                if (!e.currentTarget.open) {
                  setHandoff("");
                  setCopyStatus("");
                }
              }}
            >
              <summary>Text support and sharing options</summary>
              <p>
                The MapAble contact team accepts written enquiries. You choose
                what to put in the form.
              </p>
              <label htmlFor="handoff">
                Optional note for the contact team
              </label>
              <textarea
                id="handoff"
                value={handoff}
                onChange={(e) => {
                  setHandoff(e.target.value);
                  setCopyStatus("");
                }}
                maxLength={600}
              />
              <div className={styles.controls}>
                <button
                  disabled={!handoff.trim()}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(handoff);
                      setCopyStatus(
                        "Note copied. Paste it into the contact form if you choose.",
                      );
                    } catch {
                      setCopyStatus("Select the note and copy it manually.");
                    }
                  }}
                >
                  Copy my note
                </button>
                <a
                  href="/contact?topic=accessibility"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open text contact form (new tab)
                </a>
              </div>
              <p role="status">{copyStatus}</p>
            </details>
          </section>
        </section>
        <section
          id="results"
          tabIndex={-1}
          aria-labelledby="result-title"
          className={styles.results}
        >
          <h2 id="result-title">
            {state.demo ? "Access near St Ives" : "Search results"}
          </h2>
          <p role="status" aria-atomic="true">
            {status}
          </p>
          {!state.demo && (
            <>
              <div className={styles.welcome}>
                <h3>Explore the St Ives clinic example</h3>
                <p>
                  Compare two fictional entrances, follow the bus approach and
                  look inside a clinic.
                </p>
                <button className={styles.primary} onClick={loadExample}>
                  Open synthetic example
                </button>
              </div>
              {browse &&
                directory &&
                (directory.error ? (
                  <p>
                    The directory could not load.{" "}
                    <button onClick={retry}>Try again</button>
                  </p>
                ) : directory.hits.length ? (
                  <ul>
                    {directory.hits.map((hit) => (
                      <li key={hit.href}>
                        <a href={hit.href} rel="noreferrer">
                          {hit.title}
                        </a>
                        <p>{hit.sourceLabel}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No public pathways returned for this topic.</p>
                ))}
              <a href="/search" rel="noreferrer">
                Open full public directory search
              </a>
            </>
          )}
          {state.demo && (
            <>
              <p>
                Physio · St Ives ·{" "}
                {state.minimum === null
                  ? "No doorway filter"
                  : state.minimum + " mm doorway minimum"}
              </p>
              <div
                className={styles.controls}
                role="group"
                aria-label="Result view"
              >
                {views.map((v) => (
                  <button
                    key={v}
                    aria-pressed={state.view === v}
                    onClick={() => dispatch({ type: "view", value: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={state.alternatives}
                  onChange={(e) =>
                    dispatch({ type: "alternatives", value: e.target.checked })
                  }
                />{" "}
                Show clinics below minimum
              </label>
              {selected && state.view === "2D map" && (
                <div className={selected.plan ? styles.mapAndPlan : undefined}>
                  <StreetMap
                    selected={selected}
                    visible={visible}
                    select={(value) => dispatch({ type: "select", value })}
                  />
                  {selected.plan && (
                    <button
                      className={styles.preview}
                      onClick={() =>
                        dispatch({ type: "view", value: "3D floor plan" })
                      }
                    >
                      <img src="/search-example/clinic-one-plan.jpg" alt="" />
                      Inside clinic 1 · Open illustrated plan
                    </button>
                  )}
                </div>
              )}
              {selected && state.view === "3D floor plan" && (
                <FloorPlan clinic={selected} />
              )}
              {visible.length === 0 && (
                <p className={styles.notice}>
                  No example meets this minimum. Change the minimum or show
                  clinics below it.
                </p>
              )}
              <div className={styles.cards}>
                {visible.map((c) => (
                  <article key={c.id} data-selected={c.id === selected?.id}>
                    <h3>
                      <button
                        aria-pressed={c.id === selected?.id}
                        onClick={() =>
                          dispatch({ type: "select", value: c.id })
                        }
                      >
                        {c.id} · {c.name}
                      </button>
                    </h3>
                    <p>
                      <b>{c.door} mm</b> · {comparison(c.door, state.minimum)}
                    </p>
                    {(state.view === "List" || c.id === selected?.id) && (
                      <p>
                        {c.approach} Quiet room{" "}
                        {c.quiet ? "listed" : "unavailable"}. Ceiling hoist
                        listed.
                      </p>
                    )}
                  </article>
                ))}
              </div>
              {selected && (
                <details key={selected.id}>
                  <summary>
                    Review access notes for clinic {selected.id}
                  </summary>
                  <p>
                    {selected.door} mm clear entrance width with the door open.{" "}
                    {comparison(selected.door, state.minimum)}.{" "}
                    {selected.approach}
                  </p>
                  <p>{audit}.</p>
                </details>
              )}
              <button onClick={reset}>Leave example and clear search</button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
