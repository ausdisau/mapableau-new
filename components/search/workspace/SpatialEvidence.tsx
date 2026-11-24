import { useState } from "react";

import type { Clinic, ClinicId } from "@/mobile-contracts/search/workspace";

import styles from "./workspace.module.css";

const pins = { 1: [66, 38], 2: [82, 76] } as const;
export function StreetMap({
  selected,
  visible,
  select,
}: {
  selected: Clinic;
  visible: readonly Clinic[];
  select: (id: ClinicId) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [transit, setTransit] = useState(true);
  const [sensory, setSensory] = useState(false);
  return (
    <figure className={styles.figure}>
      <div className={styles.map}>
        <div
          className={styles.mapLayer}
          style={{
            transform: "scale(" + zoom + ")",
            transformOrigin:
              pins[selected.id][0] + "% " + pins[selected.id][1] + "%",
          }}
        >
          <svg
            viewBox="0 0 600 280"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <pattern
                id="blocks"
                patternUnits="userSpaceOnUse"
                width="78"
                height="62"
                patternTransform="rotate(-12)"
              >
                <rect width="78" height="62" fill="#e2e9e7" />
                <path d="M0 0H78M0 0V62" stroke="white" strokeWidth="12" />
                <path
                  d="M13 15h17v11H13zM40 19h20v17H40zM20 41h22v10H20z"
                  fill="#c7d2d3"
                />
              </pattern>
            </defs>
            <rect width="600" height="280" fill="url(#blocks)" />
            <path
              d="M0 0h155L90 90 0 107zM600 0v80l-80-15-32-65z"
              fill="#c0dcc9"
            />
            <path
              d="M-15 231L208 183 305 136 415 106 619 93M232 -20L283 89 324 177 423 300"
              fill="none"
              stroke="#fff"
              strokeWidth="17"
            />
            {transit && (
              <path
                d={
                  selected.id === 1
                    ? "M85 210L208 183 305 136 396 106"
                    : "M85 210L208 183 305 136 324 177 492 213"
                }
                fill="none"
                stroke="#005b7f"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={selected.id === 2 ? "9 5" : undefined}
              />
            )}
          </svg>
          {transit && <span className={styles.bus}>Bus stop</span>}
          {visible.map((c) => (
            <button
              key={c.id}
              className={styles.pin}
              aria-label={"Select clinic " + c.id + ", " + c.name}
              aria-pressed={c.id === selected.id}
              style={{ left: pins[c.id][0] + "%", top: pins[c.id][1] + "%" }}
              onFocus={() => setZoom(1)}
              onClick={() => select(c.id)}
            >
              {c.id}
            </button>
          ))}
        </div>
      </div>
      <figcaption>
        Illustrative route to clinic {selected.id}. {selected.approach}
      </figcaption>
      <div className={styles.controls}>
        <button disabled={zoom >= 1.5} onClick={() => setZoom(1.5)}>
          Zoom in
        </button>
        <button disabled={zoom === 1} onClick={() => setZoom(1)}>
          Reset map
        </button>
        <label>
          <input
            type="checkbox"
            checked={transit}
            onChange={(e) => setTransit(e.target.checked)}
          />{" "}
          Transit path
        </label>
        <button aria-expanded={sensory} onClick={() => setSensory(!sensory)}>
          Sensory layer
        </button>
      </div>
      {sensory && <p>No sensory measurements are supplied for this route.</p>}
    </figure>
  );
}
export function FloorPlan({ clinic }: { clinic: Clinic }) {
  if (!clinic.plan)
    return (
      <p className={styles.notice}>
        No plan supplied for clinic {clinic.id}. {clinic.approach} Doorway{" "}
        {clinic.door} mm.
      </p>
    );
  return (
    <figure className={styles.figure}>
      <img
        className={styles.plan}
        src="/search-example/clinic-one-plan.jpg"
        alt="Illustrative cutaway. A marks the entrance by reception. B marks the quiet room. The treatment room contains the ceiling hoist."
      />
      <figcaption>Inside clinic 1 · Illustrative plan</figcaption>
      <details>
        <summary>Read text directions</summary>
        <p>
          Enter at A and pass reception to reach the quiet room at B. The
          separate treatment room contains the ceiling hoist. Corridor widths
          and turning space are unknown.
        </p>
      </details>
    </figure>
  );
}
