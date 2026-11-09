"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";

import {
  countRatings,
  csvCell,
  evidenceRating,
  hasEvidence,
  journeyStatus,
  type SignalRating,
} from "@/lib/signal-sites/core";
import { createSeedWorkspace } from "@/lib/signal-sites/seed";
import {
  deleteEvidenceFile,
  downloadBlob,
  eraseEvidenceFiles,
  getEvidenceFile,
  loadWorkspace,
  newId,
  putEvidenceFile,
  saveWorkspace,
  todayIsoDate,
} from "@/lib/signal-sites/storage";
import {
  ACCESS_FEATURES,
  CHALLENGE_TEMPLATES,
  EVIDENCE_METHODS,
  type Challenge,
  type ChallengeStatus,
  type ChallengeTemplateId,
  type Observation,
  type ObservationKind,
  type SignalView,
  type SignalWorkspace,
} from "@/lib/signal-sites/types";

import "./signal-sites.css";

type ReviewDecision = "accept" | "needs-info" | "dispute" | "reject";
type MapPinTarget = "start" | "end";
type ObserveKind = ObservationKind;

type UiState = {
  view: SignalView;
  challengeId: string;
  observeKind: ObserveKind;
  selected: string;
  compareA: string;
  compareB: string;
  mapPinTarget: MapPinTarget;
  onlineMap: boolean;
  reportChallenge: string;
};

type LeafletMap = {
  remove: () => void;
  invalidateSize: () => void;
  setView: (latlng: [number, number], zoom: number) => void;
  on: (event: string, handler: (ev: { latlng: { lat: number; lng: number } }) => void) => void;
};

type LeafletNamespace = {
  map: (
    el: HTMLElement,
    opts?: { scrollWheelZoom?: boolean },
  ) => LeafletMap & {
    addLayer?: unknown;
  };
  tileLayer: (
    url: string,
    opts: { maxZoom: number; attribution: string },
  ) => { addTo: (map: LeafletMap) => void };
  marker: (
    latlng: [number, number],
  ) => { addTo: (map: LeafletMap) => { bindPopup: (html: string) => void } };
};

declare global {
  interface Window {
    L?: LeafletNamespace;
  }
}

const AAC_PHRASES = [
  "There is a barrier here.",
  "I am not sure yet.",
  "Please check this again.",
  "I needed an alternative route.",
  "This information was not available.",
] as const;

const NAV_ITEMS: Array<{ view: SignalView; icon: string; label: string }> = [
  { view: "overview", icon: "◫", label: "Overview" },
  { view: "challenges", icon: "▤", label: "Challenges" },
  { view: "observe", icon: "⌖", label: "Map & observe" },
  { view: "review", icon: "✓", label: "Moderation" },
  { view: "compare", icon: "⇄", label: "Compare findings" },
  { view: "reports", icon: "▧", label: "Reports & export" },
  { view: "privacy", icon: "⚙", label: "Privacy & access" },
  { view: "audit", icon: "≡", label: "Audit trail" },
];

function labelCase(s: string): string {
  return String(s || "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function timeText(v: string): string {
  if (!v) return "Not recorded";
  return new Date(v).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function templateName(id: string): string {
  return CHALLENGE_TEMPLATES.find((t) => t.id === id)?.name || "Custom";
}

function localStatus(c: Challenge): string {
  return c.status === "published-local" ? "Published locally" : labelCase(c.status);
}

function fmtNumber(v: string | number | undefined): string {
  if (v === undefined || v === "") return "Not recorded";
  return Number.isFinite(Number(v)) && String(v).trim() !== ""
    ? Number(v).toFixed(5)
    : "Not recorded";
}

function filenamePart(v: string): string {
  return String(v || "mapable-signal")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .slice(0, 45)
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function reportName(): string {
  return `mapable-signal-${todayIsoDate()}`;
}

function clampPct(v: number | undefined): number {
  return Math.min(100, Math.max(0, Number(v) || 0));
}

function rootClassName(prefs: SignalWorkspace["prefs"]): string {
  const parts = ["signal-sites-root"];
  if (prefs.highContrast) parts.push("high-contrast");
  if (prefs.largeText) parts.push("large-text");
  if (prefs.easyRead) parts.push("easy-read");
  return parts.join(" ");
}

function Tag({
  word,
  children,
}: {
  word?: string;
  children?: ReactNode;
}) {
  const cls = word ? `tag ${word}` : "tag";
  return <span className={cls}>{children ?? (word ? labelCase(word) : null)}</span>;
}

function RatingBadge({ o }: { o: Observation }) {
  if (o.notApplicable) return <Tag>Not applicable</Tag>;
  return <Tag word={evidenceRating(o)} />;
}

function ChallengeStatusBadge({ c }: { c: Challenge }) {
  const word = c.status === "published-local" ? "reviewed" : "draft";
  return <Tag word={word}>{localStatus(c)}</Tag>;
}

function Btn({
  children,
  onClick,
  className = "btn secondary sm",
  disabled,
  type = "button",
  name,
  value,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  name?: string;
  value?: string;
}) {
  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      name={name}
      value={value}
    >
      {children}
    </button>
  );
}

function Heading({
  eyebrow,
  title,
  description,
  actions,
  titleRef,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  titleRef: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 id="view-title" tabIndex={-1} ref={titleRef}>
          {title}
        </h1>
        <p className="subtitle">{description}</p>
      </div>
      {actions ? <div className="btn-bar">{actions}</div> : null}
    </div>
  );
}

function Banner({ extra }: { extra?: string }) {
  return (
    <div className="banner">
      <strong>Demonstration &amp; participant control:</strong> Sample
      observations and locations are fictional. All changes stay in this
      browser; “publish” means visible in this local workspace, not on a public
      website. Ratings describe only reviewed, scoped findings—not a promise of
      accessibility or legal compliance. {extra}
    </div>
  );
}

function Metric({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="panel metric">
      <span className="m-label">{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

function SelectField({
  id,
  label,
  choices,
  value,
  defaultValue,
  onChange,
  required,
  name,
}: {
  id: string;
  label: string;
  choices: Array<[string, string] | string>;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  name?: string;
}) {
  const controlled = value !== undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name || id}
        {...(controlled
          ? { value, onChange: (e: ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value) }
          : { defaultValue, onChange: onChange ? (e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value) : undefined })}
        required={required}
      >
        {choices.map((c) => {
          const v = Array.isArray(c) ? c[0] : c;
          const n = Array.isArray(c) ? c[1] : c;
          return (
            <option key={v} value={v}>
              {n}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function SyntheticMap({
  items,
  editable,
  onSelect,
  onPlace,
}: {
  items: Observation[];
  editable?: boolean;
  onSelect: (id: string) => void;
  onPlace?: (x: number, y: number) => void;
}) {
  const lines = items
    .filter((o) => o.kind === "journey" && o.x2 !== undefined && o.y2 !== undefined)
    .map((o) => (
      <line
        key={`line-${o.id}`}
        x1={clampPct(o.x) * 8}
        y1={clampPct(o.y) * 4.75}
        x2={clampPct(o.x2) * 8}
        y2={clampPct(o.y2) * 4.75}
        stroke="#344f77"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="9 6"
      />
    ));

  const handleClick = (ev: MouseEvent<HTMLDivElement>) => {
    if (!editable || !onPlace) return;
    const target = ev.target as HTMLElement;
    if (target.closest(".pin")) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100),
    );
    onPlace(x, y);
  };

  return (
    <div
      className="sketch-map"
      data-map-target={editable ? "1" : undefined}
      aria-label={
        editable
          ? "Illustrative map. Click to set coordinates in the form. Manual fields are also available."
          : undefined
      }
      onClick={handleClick}
      role={editable ? "application" : undefined}
    >
      <svg viewBox="0 0 800 475" preserveAspectRatio="none" role="presentation" aria-hidden="true">
        <rect width="800" height="475" fill="#eaf1ed" />
        <rect x="38" y="20" width="210" height="140" rx="15" fill="#d4e6d8" />
        <rect x="530" y="250" width="225" height="186" rx="15" fill="#d3e4ce" />
        <rect x="295" y="32" width="201" height="105" rx="14" fill="#d6e0e9" />
        <rect x="55" y="280" width="195" height="157" rx="12" fill="#dfe7ec" />
        <path
          d="M-20 190 L830 215 M320 -40 L300 520 M0 430 L800 80"
          stroke="#fcfcfa"
          strokeWidth="51"
          fill="none"
        />
        <path
          d="M-20 190 L830 215 M320 -40 L300 520 M0 430 L800 80"
          stroke="#bfcbd5"
          strokeDasharray="12 17"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M90 340 Q290 270 480 318 T720 180"
          stroke="#ef982c"
          strokeDasharray="10 8"
          strokeWidth="5"
          fill="none"
        />
        {lines}
      </svg>
      {items
        .filter((o) => o.x !== undefined && o.y !== undefined)
        .map((o, i) => {
          const rating = evidenceRating(o);
          return (
            <button
              key={o.id}
              type="button"
              className={`pin ${rating}`}
              style={{ left: `${clampPct(o.x)}%`, top: `${clampPct(o.y)}%` }}
              aria-label={`View ${o.title}, ${rating} classification`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(o.id);
              }}
            >
              {i + 1}
            </button>
          );
        })}
      <span className="map-note">Illustrative layout · not real geography</span>
    </div>
  );
}

function ObservationTable({
  items,
  onInspect,
}: {
  items: Observation[];
  onInspect: (id: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="empty">No observations yet. Create a finding to begin.</div>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Finding</th>
            <th scope="col">Classification</th>
            <th scope="col">Evidence / moderation</th>
            <th scope="col">Observed</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.title}</strong>
                <div className="small muted">
                  {o.feature} · {o.kind}
                </div>
              </td>
              <td>
                <RatingBadge o={o} />
              </td>
              <td>
                <Tag word={o.evidenceState} />{" "}
                <span className="small muted">{labelCase(o.moderation)}</span>
              </td>
              <td>{o.observedAt || "Unknown"}</td>
              <td>
                <Btn onClick={() => onInspect(o.id)}>Inspect</Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function loadLeafletFromCdn(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.L) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existingCss = document.querySelector('link[data-signal-leaflet="1"]');
    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.signalLeaflet = "1";
      document.head.appendChild(link);
    }
    const existingScript = document.querySelector(
      'script[data-signal-leaflet="1"]',
    );
    if (existingScript && window.L) {
      resolve();
      return;
    }
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () =>
        reject(new Error("Leaflet could not load")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.dataset.signalLeaflet = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet could not load"));
    document.head.appendChild(script);
  });
}

function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function readNum(raw: FormDataEntryValue | string | null | undefined): number | undefined {
  const v = String(raw ?? "").trim();
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function validateCoords(
  v: number | undefined,
  lo: number,
  hi: number,
): boolean {
  return v === undefined || (Number.isFinite(v) && v >= lo && v <= hi);
}

export default function SignalSitesApp() {
  const [store, setStore] = useState<SignalWorkspace>(() => createSeedWorkspace());
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [ui, setUi] = useState<UiState>({
    view: "overview",
    challengeId: "c1",
    observeKind: "place",
    selected: "o3",
    compareA: "o1",
    compareB: "o3",
    mapPinTarget: "start",
    onlineMap: false,
    reportChallenge: "all",
  });
  const [toast, setToast] = useState("");
  const [announce, setAnnounce] = useState("");
  const [formCoords, setFormCoords] = useState({
    x: "50",
    y: "50",
    x2: "65",
    y2: "65",
    latitude: "",
    longitude: "",
    latitude2: "",
    longitude2: "",
  });
  const [findingText, setFindingText] = useState("");
  const [mapError, setMapError] = useState("");
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leafletRef = useRef<LeafletMap | null>(null);
  const liveMapRef = useRef<HTMLDivElement | null>(null);
  const findingRef = useRef<HTMLTextAreaElement | null>(null);
  const focusTitleNext = useRef(false);
  const formId = useId();

  useEffect(() => {
    const loaded = loadWorkspace();
    setStore(loaded);
    setUi((prev) => ({
      ...prev,
      challengeId: loaded.challenges[0]?.id || prev.challengeId,
      selected: loaded.observations.find((o) =>
        ["submitted", "needs-info"].includes(o.moderation),
      )?.id || loaded.observations[0]?.id || prev.selected,
      compareA: loaded.observations[0]?.id || prev.compareA,
      compareB: loaded.observations[1]?.id || loaded.observations[0]?.id || prev.compareB,
    }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      saveWorkspace(store);
      setStorageError("");
    } catch {
      setStorageError("Browser storage is unavailable or full. Recent changes have not been saved; export your records before closing this page.");
    }
  }, [store, hydrated]);

  useEffect(() => {
    if (!focusTitleNext.current) return;
    focusTitleNext.current = false;
    titleRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [ui.view]);

  const announceMsg = useCallback((message: string) => {
    setAnnounce(String(message));
  }, []);

  const showToast = useCallback(
    (message: string) => {
      announceMsg(message);
      setToast(message);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 4200);
    },
    [announceMsg],
  );

  const audit = useCallback((action: string, _detail: string) => {
    setStore((prev) => ({
      ...prev,
      audit: [
        {
          id: newId(),
          action,
          detail: "Action recorded. Personal details are not stored in the audit trail.",
          at: new Date().toISOString(),
          actor: "Local workspace user",
        },
        ...prev.audit,
      ].slice(0, 400),
    }));
  }, []);

  const goto = useCallback((view: SignalView) => {
    focusTitleNext.current = true;
    setUi((prev) => ({ ...prev, view }));
  }, []);

  const updateStore = useCallback(
    (mutator: (prev: SignalWorkspace) => SignalWorkspace) => {
      setStore(mutator);
    },
    [],
  );

  const stats = useMemo(() => {
    const ratings = countRatings(store.observations);
    return {
      ratings,
      active: store.challenges.filter((c) => c.status === "published-local").length,
      queue: store.observations.filter((o) =>
        ["submitted", "needs-info"].includes(o.moderation),
      ).length,
    };
  }, [store.observations, store.challenges]);

  const reportObservations = useMemo(() => {
    return ui.reportChallenge && ui.reportChallenge !== "all"
      ? store.observations.filter((o) => o.challengeId === ui.reportChallenge)
      : store.observations;
  }, [store.observations, ui.reportChallenge]);

  const observeChallenge =
    store.challenges.find((c) => c.id === ui.challengeId) || store.challenges[0];
  const observeItems = store.observations.filter(
    (o) => !observeChallenge || o.challengeId === observeChallenge.id,
  );

  // Optional online map — loads Leaflet from CDN only after explicit consent.
  useEffect(() => {
    if (!ui.onlineMap || ui.view !== "observe") {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await loadLeafletFromCdn();
        if (cancelled || !liveMapRef.current || !window.L) return;
        if (leafletRef.current) {
          leafletRef.current.remove();
          leafletRef.current = null;
        }
        const L = window.L;
        const map = L.map(liveMapRef.current, { scrollWheelZoom: false }).setView(
          [-33.8688, 151.2093],
          13,
        ) as unknown as LeafletMap;
        leafletRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
        const points = store.observations.filter(
          (o) =>
            o.latitude !== "" &&
            o.latitude != null &&
            o.longitude !== "" &&
            o.longitude != null &&
            Number.isFinite(+o.latitude) &&
            Number.isFinite(+o.longitude),
        );
        points.forEach((o) => {
          L.marker([+o.latitude!, +o.longitude!])
            .addTo(map)
            .bindPopup(
              `<strong>${escapeHtml(o.title)}</strong><div>${escapeHtml(evidenceRating(o))} · ${escapeHtml(o.evidenceState)}</div>`,
            );
        });
        if (points.length) {
          map.setView([+points[0].latitude!, +points[0].longitude!], 14);
        }
        map.on("click", (ev) => {
          const end = ui.mapPinTarget === "end";
          const lat = ev.latlng.lat.toFixed(6);
          const lon = ev.latlng.lng.toFixed(6);
          setFormCoords((prev) =>
            end
              ? { ...prev, latitude2: lat, longitude2: lon }
              : { ...prev, latitude: lat, longitude: lon },
          );
          showToast(`Coordinate added to ${ui.mapPinTarget} fields.`);
        });
        setTimeout(() => map.invalidateSize(), 200);
        setMapError("");
      } catch {
        if (cancelled) return;
        setUi((prev) => ({ ...prev, onlineMap: false }));
        setMapError(
          "Online map could not load. Use the illustrative map or coordinate fields.",
        );
        showToast("Online tiles unavailable. The local observation form still works.");
      }
    })();
    return () => {
      cancelled = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [ui.onlineMap, ui.view, ui.mapPinTarget, store.observations, showToast]);

  function escapeHtml(v: unknown): string {
    return String(v == null ? "" : v).replace(
      /[&<>"']/g,
      (ch) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
          ch
        ] || ch,
    );
  }

  function openObservation(id: string) {
    setUi((prev) => ({ ...prev, selected: id, view: "observation-detail" }));
    focusTitleNext.current = true;
  }

  function openChallenge(id: string) {
    setUi((prev) => ({ ...prev, challengeId: id, view: "challenge-detail" }));
    focusTitleNext.current = true;
  }

  function openObserveFor(id: string) {
    setUi((prev) => ({ ...prev, challengeId: id, view: "observe" }));
    focusTitleNext.current = true;
  }

  function updateChallengeStatus(id: string, status: ChallengeStatus) {
    const c = store.challenges.find((ch) => ch.id === id);
    if (!c) return;
    if (
      status === "published-local" &&
      !window.confirm(
        "Publish this challenge to the LOCAL demo workspace only? This will NOT put the challenge online or contact participants.",
      )
    ) {
      return;
    }
    updateStore((prev) => ({
      ...prev,
      challenges: prev.challenges.map((ch) =>
        ch.id === id ? { ...ch, status } : ch,
      ),
    }));
    audit("Challenge status changed", `${c.title} → ${status}`);
    showToast(`Challenge status: ${status === "published-local" ? "Published locally" : labelCase(status)}.`);
  }

  function handleCreateChallenge(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const templateId = String(f.get("ctemplate") || "journey");
    const t = CHALLENGE_TEMPLATES.find((x) => x.id === templateId);
    const o: Challenge = {
      id: newId(),
      title: String(f.get("ctitle") || "").trim(),
      template: templateId as ChallengeTemplateId,
      boundary: String(f.get("cboundary") || "").trim(),
      focus: String(f.get("cfocus") || t?.focus || "").trim(),
      instruction: String(f.get("cinstruction") || t?.instruction || "").trim(),
      status: "draft",
      createdAt: new Date().toISOString(),
      isSeed: false,
    };
    if (!o.title || !o.boundary) {
      showToast("Title and boundary are required.");
      return;
    }
    updateStore((prev) => ({
      ...prev,
      challenges: [o, ...prev.challenges],
    }));
    setUi((prev) => ({ ...prev, challengeId: o.id, view: "challenge-detail" }));
    focusTitleNext.current = true;
    audit("Challenge created", `${o.title} — local draft`);
    showToast("Local challenge draft created.");
    ev.currentTarget.reset();
  }

  function chooseTemplate(templateId: string) {
    const t = CHALLENGE_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    const form = document.getElementById("create-challenge") as HTMLFormElement | null;
    if (!form) return;
    const templateEl = form.elements.namedItem("ctemplate") as HTMLSelectElement | null;
    const focusEl = form.elements.namedItem("cfocus") as HTMLInputElement | null;
    const instructionEl = form.elements.namedItem(
      "cinstruction",
    ) as HTMLTextAreaElement | null;
    const titleEl = form.elements.namedItem("ctitle") as HTMLInputElement | null;
    if (templateEl) templateEl.value = t.id;
    if (focusEl) focusEl.value = t.focus;
    if (instructionEl) instructionEl.value = t.instruction;
    titleEl?.focus();
    showToast("Template selected. You control the scope and wording.");
  }

  async function handleCreateObservation(
    ev: FormEvent<HTMLFormElement>,
    decision: "draft" | "submitted",
  ) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const title = String(f.get("otitle") || "").trim();
    const finding = String(f.get("ofinding") || findingText || "").trim();
    if (!title || finding.length < 12 || !f.get("confirmLocal")) {
      showToast(
        "Provide a feature, a specific observation and local-storage confirmation.",
      );
      return;
    }
    const ch = store.challenges.find((c) => c.id === String(f.get("ochallenge")));
    if (!ch) {
      showToast("Select an existing challenge.");
      return;
    }
    if (ch.status === "closed") {
      showToast("This challenge is closed. Reopen a new challenge to add findings.");
      return;
    }
    const proposed = String(f.get("oproposed") || "unknown") as SignalRating;
    const o: Observation = {
      id: newId(),
      challengeId: ch.id,
      title,
      kind: (String(f.get("okind") || "place") as ObservationKind),
      claimBasis: String(f.get("obasis") || "observed"),
      feature: String(f.get("ofeature") || "Other"),
      requirement: String(f.get("orequirement") || "").trim(),
      finding,
      measurement: String(f.get("omeasurement") || "").trim(),
      method: String(f.get("omethod") || "community report"),
      source: String(f.get("osource") || "").trim(),
      observedAt: String(f.get("odate") || todayIsoDate()),
      reviewBy: String(f.get("oreviewdate") || ""),
      proposed,
      evidenceState: "reported",
      moderation: decision === "submitted" ? "submitted" : "draft",
      reviewNote: "",
      alternative: String(f.get("oalternative") || "Not checked"),
      alternativeVerified: !!f.get("alternativeVerified"),
      noVerifiedAlternative: !!f.get("noVerifiedAlternative"),
      urgentHazard: !!f.get("urgentHazard"),
      notApplicable: !!f.get("notApplicable"),
      x: readNum(formCoords.x || f.get("ox")),
      y: readNum(formCoords.y || f.get("oy")),
      x2: readNum(formCoords.x2 || f.get("ox2")),
      y2: readNum(formCoords.y2 || f.get("oy2")),
      latitude: readNum(formCoords.latitude || f.get("olat")),
      longitude: readNum(formCoords.longitude || f.get("olon")),
      latitude2: readNum(formCoords.latitude2 || f.get("olat2")),
      longitude2: readNum(formCoords.longitude2 || f.get("olon2")),
      evidenceIds: [],
      isSeed: false,
    };
    if (
      !validateCoords(o.latitude as number | undefined, -90, 90) ||
      !validateCoords(o.latitude2 as number | undefined, -90, 90) ||
      !validateCoords(o.longitude as number | undefined, -180, 180) ||
      !validateCoords(o.longitude2 as number | undefined, -180, 180)
    ) {
      showToast("Check latitude and longitude ranges.");
      return;
    }
    if (o.alternativeVerified && o.noVerifiedAlternative) {
      showToast(
        "Select either a verified alternative or a checked absence of one, not both.",
      );
      return;
    }
    if (
      o.urgentHazard &&
      !window.confirm(
        "Urgent hazard reports in this demo do not notify an authority or emergency service. You must use the relevant real-world escalation process. Save anyway?",
      )
    ) {
      return;
    }
    const fileInput = form.elements.namedItem("ofile") as HTMLInputElement | null;
    const files = Array.from(fileInput?.files || []);
    if (files.length > 5 || files.some((file) => file.size > 8 * 1024 * 1024)) {
      showToast("Choose up to five files, each at most 8 MB.");
      return;
    }
    try {
      for (const file of files) {
        const k = newId();
        await putEvidenceFile(k, {
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          blob: file,
        });
        o.evidenceIds.push(k);
      }
    } catch {
      showToast("An attachment could not be saved. Observation was not submitted.");
      return;
    }
    updateStore((prev) => ({
      ...prev,
      observations: [o, ...prev.observations],
    }));
    setUi((prev) => ({
      ...prev,
      selected: o.id,
      challengeId: ch.id,
      view: "observation-detail",
    }));
    focusTitleNext.current = true;
    setFindingText("");
    audit(
      decision === "submitted"
        ? "Observation submitted for local review"
        : "Observation draft saved",
      `${o.title} (classification Unknown pending review)`,
    );
    showToast("Saved on this device. Current classification: Unknown.");
  }

  function handleReview(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const submitter = (ev.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;
    const decision = (submitter?.value || "needs-info") as ReviewDecision;
    const o = store.observations.find((x) => x.id === String(f.get("id")));
    if (!o) return;
    const note = String(f.get("reviewNote") || "").trim();
    if (note.length < 12) {
      showToast("Add a review reason of at least 12 characters.");
      return;
    }
    if (decision === "accept" && !hasEvidence(o)) {
      showToast("Missing evidence. Request clarification instead of approving.");
      return;
    }

    let evidenceState = o.evidenceState;
    let moderation = o.moderation;
    switch (decision) {
      case "accept":
        evidenceState = "reviewed";
        moderation = "accepted";
        break;
      case "needs-info":
        evidenceState = "reported";
        moderation = "needs-info";
        break;
      case "dispute":
        evidenceState = "disputed";
        moderation = "needs-info";
        break;
      case "reject":
        evidenceState = "reported";
        moderation = "rejected";
        break;
      default: {
        const _exhaustive: never = decision;
        return _exhaustive;
      }
    }

    updateStore((prev) => ({
      ...prev,
      observations: prev.observations.map((x) =>
        x.id === o.id
          ? { ...x, reviewNote: note, evidenceState, moderation }
          : x,
      ),
    }));
    audit(`Review decision: ${decision}`, `${o.title} — ${note.slice(0, 120)}`);
    showToast(`Local decision recorded: ${labelCase(decision)}.`);
  }

  function updateObservationStatus(
    id: string,
    change: "submitted" | "disputed" | "outdated",
  ) {
    const o = store.observations.find((x) => x.id === id);
    if (!o) return;
    updateStore((prev) => ({
      ...prev,
      observations: prev.observations.map((x) => {
        if (x.id !== id) return x;
        if (change === "submitted") {
          return { ...x, moderation: "submitted", evidenceState: "reported" };
        }
        if (change === "disputed") {
          return { ...x, moderation: "needs-info", evidenceState: "disputed" };
        }
        return { ...x, evidenceState: "outdated", moderation: "needs-info" };
      }),
    }));
    audit(`Observation ${change}`, o.title);
    showToast("Status updated. Review the visible evidence state.");
  }

  async function deleteObservation(id: string) {
    const o = store.observations.find((x) => x.id === id);
    if (!o) return;
    if (
      !window.confirm(
        `Withdraw and delete "${o.title}" and its ${o.evidenceIds?.length || 0} local evidence file(s)? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      for (const k of o.evidenceIds || []) {
        await deleteEvidenceFile(k);
      }
    } catch {
      showToast("Some evidence files could not be erased. The observation is retained so you can retry or clear browser site data.");
      return;
    }
    updateStore((prev) => ({
      ...prev,
      observations: prev.observations.filter((a) => a.id !== id),
      // Older local audit entries could contain observation titles or review notes.
      // Remove all historical detail text rather than retaining deleted personal content.
      audit: [
        {
          id: newId(),
          action: "Observation withdrawn and local evidence removed",
          detail: "Submission content removed at participant request",
          at: new Date().toISOString(),
          actor: "Local workspace user",
        },
        ...prev.audit.map((entry) => ({
          ...entry,
          detail: "Earlier audit detail erased for privacy",
        })),
      ].slice(0, 400),
    }));
    goto("observe");
    showToast("Observation and its attachments removed from this browser workspace.");
  }

  async function wipeWorkspace() {
    if (
      !window.confirm(
        "Erase ALL local challenges, observations, evidence files and audit history from this browser? Export a copy first if you need one.",
      )
    ) {
      return;
    }
    if (
      !window.confirm(
        "Final confirmation: erase this local workspace, including the synthetic examples?",
      )
    ) {
      return;
    }
    try {
      await eraseEvidenceFiles();
    } catch {
      showToast(
        "Some browser evidence files could not be erased; check browser site data.",
      );
      return;
    }
    setStore({
      version: 1,
      challenges: [],
      observations: [],
      audit: [],
      prefs: store.prefs,
      consents: {
        localStore: true,
        includeLocation: false,
        includeEvidence: false,
      },
    });
    setUi((prev) => ({ ...prev, challengeId: "", view: "overview" }));
    focusTitleNext.current = true;
    showToast(
      "This app workspace was erased from local storage. Browser backups and previously exported copies are outside this app.",
    );
  }

  function exportText(
    filename: string,
    data: string,
    type = "text/plain;charset=utf-8",
  ) {
    downloadBlob(filename, new Blob([data], { type }));
    showToast(`${filename} saved to your device. No server submission.`);
  }

  async function exportJson() {
    const exact = !!store.consents.includeLocation;
    const withFiles = !!store.consents.includeEvidence;
    const observations = reportObservations.map((o) => {
      const item: Record<string, unknown> = { ...o };
      if (!exact) {
        delete item.latitude;
        delete item.longitude;
        delete item.latitude2;
        delete item.longitude2;
      }
      if (!withFiles) delete item.evidenceIds;
      return item;
    });
    const pack: Record<string, unknown> = {
      format: "MapAble Signal Local Workspace Export",
      version: 1,
      exportedAt: new Date().toISOString(),
      notice:
        "User-controlled local export. Do not assume verification, accreditation, universal access or compliance.",
      privacy: { coordinatesIncluded: exact, evidenceIncluded: withFiles },
      challenges: store.challenges,
      observations,
      audit: withFiles || exact ? store.audit : [],
    };
    if (withFiles) {
      const attachments: Record<string, unknown> = {};
      for (const o of observations) {
        for (const key of (o.evidenceIds as string[] | undefined) || []) {
          try {
            const file = await getEvidenceFile(key);
            if (file) {
              attachments[key] = {
                name: file.name,
                type: file.type,
                size: file.size,
                dataURL: await fileToDataUrl(file.blob),
              };
            }
          } catch {
            attachments[key] = { missing: true };
          }
        }
      }
      pack.attachments = attachments;
    }
    exportText(
      `${reportName()}${exact || withFiles ? "-private" : ""}.json`,
      JSON.stringify(pack, null, 2),
      "application/json",
    );
    audit(
      "Data exported",
      `JSON; coordinates: ${exact}; attachments: ${withFiles}; local file only`,
    );
  }

  function exportCsv() {
    const fields = [
      "Challenge",
      "Observation",
      "Kind",
      "Feature",
      "Requirement",
      "Finding",
      "Measurement",
      "Method",
      "Source",
      "Date",
      "ReviewBy",
      "EvidenceBasis",
      "EvidenceState",
      "LocalModeration",
      "Signal",
      "Limitation",
      "UrgentHazard",
    ];
    const safe = (v: unknown) => {
      let text = String(v ?? "");
      if (/^\s*[=+@\-\t\r]/.test(text)) text = `'${text}`;
      return csvCell(text);
    };
    const rows = reportObservations.map((o) => {
      const c = store.challenges.find((ch) => ch.id === o.challengeId);
      return [
        c?.title || "",
        o.title,
        o.kind,
        o.feature,
        o.requirement,
        o.finding,
        o.measurement,
        o.method,
        o.source,
        o.observedAt,
        o.reviewBy,
        o.claimBasis || "Not recorded",
        o.evidenceState,
        o.moderation,
        evidenceRating(o),
        o.reviewNote,
        o.urgentHazard ? "Escalation required" : "Not flagged",
      ]
        .map(safe)
        .join(",");
    });
    const text =
      "\ufeff" + fields.map(safe).join(",") + "\r\n" + rows.join("\r\n");
    exportText(
      `${reportName()}-redacted.csv`,
      text,
      "text/csv;charset=utf-8",
    );
    audit(
      "Redacted CSV exported",
      `${rows.length} observations; exact coordinates and file content excluded`,
    );
  }

  function makeReportHtml(): string {
    const items = reportObservations;
    const counts = countRatings(items);
    const title =
      ui.reportChallenge && ui.reportChallenge !== "all"
        ? store.challenges.find((c) => c.id === ui.reportChallenge)?.title
        : "All local challenges";
    const rows = items
      .map(
        (o) =>
          `<tr><th scope="row">${escapeHtml(o.title)}</th><td>${escapeHtml(o.feature)}</td><td>${escapeHtml(o.requirement)}</td><td>${escapeHtml(o.claimBasis || "Not stated")}</td><td>${escapeHtml(evidenceRating(o)).toUpperCase()}</td><td>${escapeHtml(o.finding)}</td><td>${escapeHtml(o.method)}</td><td>${escapeHtml(o.observedAt)}</td><td>${escapeHtml(o.evidenceState)}</td><td>${escapeHtml(o.reviewNote || "Not locally reviewed")}</td></tr>`,
      )
      .join("");
    return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MapAble Signal Report — ${escapeHtml(title)}</title><style>body{font:16px/1.5 system-ui,sans-serif;color:#182a42;max-width:1200px;margin:30px auto;padding:0 20px}h1{color:#173b63}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #9aaabd;padding:9px;text-align:left;vertical-align:top}thead{background:#e6edf5}table{display:block;overflow:auto}p{max-width:850px}.warning{border:2px solid #9a5a19;background:#fff8eb;padding:14px;margin:18px 0}@media print{body{margin:0}table{display:table;font-size:10px}tr{break-inside:avoid}}</style></head><body><header><p>Australian Disability Ltd · MapAble Signal</p><h1>Community Mapping Challenge evidence report</h1><p><strong>Scope:</strong> ${escapeHtml(title)}</p><p><strong>Exported:</strong> ${escapeHtml(new Date().toLocaleString("en-AU"))}</p></header><div class="warning"><strong>Important evidence limitation:</strong> This report contains local or synthetic records and is not an accredited accessibility assessment, statutory compliance conclusion, or guarantee of safe access. Unknown means missing, stale, disputed or insufficiently reviewed evidence. All exact coordinates, participant identifiers and attachments have been excluded.</div><p>Observations: ${items.length} | Red: ${counts.red} | Amber: ${counts.amber} | Green: ${counts.green} | Unknown: ${counts.unknown} | Not applicable: ${counts.notApplicable}</p><table><thead><tr><th>Finding</th><th>Feature</th><th>Functional requirement</th><th>Evidence basis</th><th>Signal</th><th>Recorded observation</th><th>Method</th><th>Date</th><th>Evidence</th><th>Limitations / review</th></tr></thead><tbody>${rows}</tbody></table><footer><p>Observed facts are distinguished from community reports, local review and unknowns. A local reviewer is not an independent accredited assessor. Free-text fields may contain identifiable information and must be checked manually before sharing. Corrections and reinspection should retain version history.</p></footer></body></html>`;
  }

  function exportHtml() {
    exportText(
      `${reportName()}-report.html`,
      makeReportHtml(),
      "text/html;charset=utf-8",
    );
    audit("HTML report exported", "Redacted scope-specific report downloaded.");
  }

  function printReport() {
    const html = makeReportHtml();
    const w = window.open("", "_blank");
    if (!w) {
      showToast("Pop-up blocked. Download the HTML report instead.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
    audit("Print-ready report opened", "No external transmission");
  }

  function insertAacPhrase(phrase: string) {
    const el = findingRef.current;
    if (!el) {
      setFindingText((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${phrase} `);
      announceMsg("Phrase inserted; you can edit the text.");
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next =
      el.value.slice(0, start) +
      (start && el.value[start - 1] !== " " ? " " : "") +
      phrase +
      " " +
      el.value.slice(end);
    setFindingText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = next.length;
    });
    announceMsg("Phrase inserted; you can edit the text.");
  }

  function enableOnlineMap() {
    if (
      !window.confirm(
        "Enable online OpenStreetMap tiles? Loading Leaflet from a CDN and map tiles sends the viewed map area and network metadata to external services. No observations are automatically submitted. Continue?",
      )
    ) {
      return;
    }
    setUi((prev) => ({ ...prev, onlineMap: true }));
    audit(
      "Online map permitted for this session",
      "User opted into CDN and OpenStreetMap tile requests",
    );
  }

  function placeOnMap(x: number, y: number) {
    const end = ui.mapPinTarget === "end";
    setFormCoords((prev) =>
      end
        ? { ...prev, x2: x.toFixed(1), y2: y.toFixed(1) }
        : { ...prev, x: x.toFixed(1), y: y.toFixed(1) },
    );
    showToast(
      `Illustrative ${ui.mapPinTarget} marker: ${x.toFixed(0)}%, ${y.toFixed(0)}%.`,
    );
  }

  function ChallengeCard({ c }: { c: Challenge }) {
    const count = store.observations.filter((o) => o.challengeId === c.id).length;
    const complete = store.observations.filter(
      (o) => o.challengeId === c.id && o.moderation === "accepted",
    ).length;
    return (
      <article className="panel challenge-card">
        <div className="meta">
          <ChallengeStatusBadge c={c} />{" "}
          {c.isSeed ? <Tag>Synthetic example</Tag> : null}
          <span>{templateName(c.template)}</span>
        </div>
        <h3>{c.title}</h3>
        <p>{c.focus}</p>
        <div className="small muted">{c.boundary}</div>
        <div
          className="progress"
          role="img"
          aria-label={`${complete} locally reviewed of ${count} observations`}
        >
          <span
            style={{
              width: `${count ? Math.round((100 * complete) / count) : 0}%`,
            }}
          />
        </div>
        <div className="meta">
          {count} observations · {complete} locally reviewed
        </div>
        <div className="btn-bar">
          <Btn onClick={() => openChallenge(c.id)}>Open challenge</Btn>
          <Btn className="btn sm" onClick={() => openObserveFor(c.id)}>
            Add observation
          </Btn>
        </div>
      </article>
    );
  }

  function renderOverview() {
    return (
      <>
        <Heading
          eyebrow="MapAble Signal"
          title="Mapping access, together"
          description="Create local mapping challenges, record precise findings and review uncertainty before anyone relies on a result."
          actions={
            <Btn
              className="btn orange"
              onClick={() => goto("challenges")}
            >
              + New challenge
            </Btn>
          }
          titleRef={titleRef}
        />
        <Banner />
        <div className="grid four">
          <Metric
            label="Challenges"
            value={store.challenges.length}
            description="Templates and community tasks"
          />
          <Metric
            label="Observations"
            value={store.observations.length}
            description="Feature and journey-level"
          />
          <Metric
            label="Unknown findings"
            value={stats.ratings.unknown}
            description="Missing or unreviewed evidence"
          />
          <Metric
            label="Review queue"
            value={stats.queue}
            description="Requires a human decision"
          />
        </div>
        <div className="section-top">
          <h2>Current challenges</h2>
          <Btn onClick={() => goto("challenges")}>View all</Btn>
        </div>
        <div className="grid three">
          {store.challenges.slice(0, 3).map((c) => (
            <ChallengeCard key={c.id} c={c} />
          ))}
          {!store.challenges.length ? (
            <div className="empty">No challenges yet.</div>
          ) : null}
        </div>
        <div className="section-top">
          <h2>Evidence signals</h2>
          <Btn onClick={() => goto("compare")}>Compare findings</Btn>
        </div>
        <div className="panel">
          <div className="legend">
            <Tag word="red" />
            <Tag word="amber" />
            <Tag word="green" />
            <Tag word="unknown" />
          </div>
          <p className="small">
            A Red, Amber or Green label requires a documented, scoped finding and
            a local human review. <strong>Unknown</strong> remains in place when
            evidence is missing, stale, unreviewed or disputed. Locally reviewed
            is not independent verification.
          </p>
          <div className="btn-bar">
            <Btn className="btn orange" onClick={() => goto("observe")}>
              Record a finding
            </Btn>
            <Btn onClick={() => goto("review")}>Open review queue</Btn>
          </div>
        </div>
      </>
    );
  }

  function renderChallenges() {
    return (
      <>
        <Heading
          eyebrow="1 · Set the scope"
          title="Community challenges"
          description="Choose a reusable template, explain what is in scope, then publish to your local workspace. Remote public publishing is unavailable."
          titleRef={titleRef}
        />
        <Banner />
        <div className="grid two">
          <div className="panel">
            <h2>Create a challenge</h2>
            <form
              id="create-challenge"
              className="stack"
              onSubmit={handleCreateChallenge}
            >
              <div className="field">
                <label htmlFor="ctitle">
                  Challenge title <span aria-hidden="true">*</span>
                </label>
                <input
                  id="ctitle"
                  name="ctitle"
                  maxLength={120}
                  placeholder="e.g. Community centre entrance check"
                  required
                />
              </div>
              <SelectField
                id="ctemplate"
                label="Structured template"
                choices={CHALLENGE_TEMPLATES.map((t) => [t.id, t.name])}
                defaultValue="journey"
              />
              <div className="field">
                <label htmlFor="cboundary">
                  Place or journey boundary <span aria-hidden="true">*</span>
                </label>
                <input
                  id="cboundary"
                  name="cboundary"
                  placeholder="Areas and connections to observe"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="cfocus">Functional requirement or goal</label>
                <input
                  id="cfocus"
                  name="cfocus"
                  placeholder="e.g. Step-free arrival and orientation"
                />
              </div>
              <div className="field">
                <label htmlFor="cinstruction">Participant instructions</label>
                <textarea
                  id="cinstruction"
                  name="cinstruction"
                  placeholder="Describe what to collect, not what to assume"
                />
              </div>
              <p className="hint">
                Creating a challenge does not invite people or publish data
                online.
              </p>
              <button type="submit" className="btn orange">
                Create local draft
              </button>
            </form>
          </div>
          <div className="panel">
            <h2>Start with a template</h2>
            <div className="stack">
              {CHALLENGE_TEMPLATES.map((t) => (
                <div className="soft" key={t.id}>
                  <strong>
                    {t.icon} · {t.name}
                  </strong>
                  <p className="small" style={{ margin: "4px 0" }}>
                    {t.focus}
                  </p>
                  <Btn onClick={() => chooseTemplate(t.id)}>Use template</Btn>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="section-top">
          <h2>Challenge workspace</h2>
        </div>
        <div className="grid three">
          {store.challenges.map((c) => (
            <ChallengeCard key={c.id} c={c} />
          ))}
          {!store.challenges.length ? <p>No challenges yet.</p> : null}
        </div>
      </>
    );
  }

  function renderChallengeDetail() {
    const c =
      store.challenges.find((ch) => ch.id === ui.challengeId) ||
      store.challenges[0];
    if (!c) return renderChallenges();
    const obs = store.observations.filter((o) => o.challengeId === c.id);
    const route = journeyStatus(obs.filter((o) => o.kind === "journey"));
    return (
      <>
        <Heading
          eyebrow="Challenge details"
          title={c.title}
          description={c.boundary}
          actions={
            <Btn onClick={() => goto("challenges")}>Back to challenges</Btn>
          }
          titleRef={titleRef}
        />
        <Banner />
        <div className="grid two">
          <div className="panel">
            <div className="meta">
              <ChallengeStatusBadge c={c} />
              {c.isSeed ? <Tag>Synthetic</Tag> : null}
            </div>
            <h2>Scope and instructions</h2>
            <p>
              <strong>Goal:</strong> {c.focus}
            </p>
            <p>
              <strong>Instructions:</strong> {c.instruction}
            </p>
            <p className="small">
              <strong>Type:</strong> {templateName(c.template)}
            </p>
            <div className="btn-bar">
              {c.status === "draft" ? (
                <Btn
                  className="btn orange"
                  onClick={() => updateChallengeStatus(c.id, "published-local")}
                >
                  Publish in this browser
                </Btn>
              ) : null}
              {c.status === "published-local" ? (
                <Btn onClick={() => updateChallengeStatus(c.id, "paused")}>
                  Pause
                </Btn>
              ) : null}
              {c.status === "paused" ? (
                <Btn onClick={() => updateChallengeStatus(c.id, "published-local")}>
                  Resume locally
                </Btn>
              ) : null}
              {c.status !== "closed" ? (
                <Btn onClick={() => updateChallengeStatus(c.id, "closed")}>
                  Close challenge
                </Btn>
              ) : null}
              <Btn className="btn" onClick={() => openObserveFor(c.id)}>
                Add finding
              </Btn>
            </div>
          </div>
          <div className="panel">
            <h2>Journey caution</h2>
            <div>
              <Tag word={route.rating} />
              <p className="small" style={{ marginTop: 8 }}>
                {route.reason}
              </p>
            </div>
            <p className="small">
              Calculated only from journey observations in this challenge; a
              place finding must never be treated as proof of all connected
              routes.
            </p>
            <div className="legend">
              {(["red", "amber", "green", "unknown"] as const).map((k) => (
                <span key={k}>
                  <Tag word={k} />{" "}
                  {obs.filter((o) => evidenceRating(o) === k).length}{" "}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="section-top">
          <h2>Linked findings ({obs.length})</h2>
          <Btn onClick={() => goto("review")}>Review queue</Btn>
        </div>
        <ObservationTable items={obs} onInspect={openObservation} />
      </>
    );
  }

  function renderObserve() {
    const c = observeChallenge;
    return (
      <>
        <Heading
          eyebrow="2 · Collect observations"
          title="Map and observe"
          description="Map a place or journey segment. Use precise evidence, practical measurements, AAC-friendly text and optional local attachments."
          titleRef={titleRef}
        />
        <Banner extra="Uploading evidence stores it only on this device; do not include identifiable bystanders or private home addresses." />
        <div className="steps">
          <span>1 · Choose a challenge</span>
          <span>2 · Describe a feature</span>
          <span>3 · Save draft</span>
          <span>4 · Request review</span>
        </div>
        <div className="grid two" style={{ alignItems: "start" }}>
          <div className="panel">
            <h2>New access observation</h2>
            <form
              id={`observation-form-${formId}`}
              className="stack"
              onSubmit={(ev) => {
                const submitter = (ev.nativeEvent as SubmitEvent)
                  .submitter as HTMLButtonElement | null;
                const decision =
                  submitter?.value === "submitted" ? "submitted" : "draft";
                void handleCreateObservation(ev, decision);
              }}
            >
              <SelectField
                id="ochallenge"
                label="Challenge"
                choices={store.challenges.map((ch) => [ch.id, ch.title])}
                value={c?.id || ""}
                required
                onChange={(v) =>
                  setUi((prev) => ({ ...prev, challengeId: v }))
                }
              />
              <SelectField
                id="okind"
                label="Observation type"
                choices={[
                  ["place", "Place or feature"],
                  ["journey", "Journey connection / segment"],
                ]}
                value={ui.observeKind}
                onChange={(v) =>
                  setUi((prev) => ({
                    ...prev,
                    observeKind: v as ObserveKind,
                  }))
                }
              />
              <div className="field">
                <label htmlFor="otitle">Feature / segment name *</label>
                <input
                  id="otitle"
                  name="otitle"
                  required
                  maxLength={140}
                  placeholder="e.g. West entry doorway"
                />
              </div>
              <SelectField
                id="ofeature"
                label="Access feature"
                choices={[...ACCESS_FEATURES]}
                defaultValue="Path / surface"
              />
              <div className="field">
                <label htmlFor="orequirement">Functional requirement</label>
                <input
                  id="orequirement"
                  name="orequirement"
                  placeholder="e.g. Step-free entry, readable signage"
                />
              </div>
              <div className="field">
                <label htmlFor="ofinding">What was actually observed? *</label>
                <textarea
                  id="ofinding"
                  name="ofinding"
                  required
                  minLength={12}
                  ref={findingRef}
                  value={findingText}
                  onChange={(e) => setFindingText(e.target.value)}
                  placeholder="Record what you saw or measured, not a diagnosis or overall guarantee"
                />
                <div className="hint">
                  AAC phrase shortcuts (insert text then edit it in your own
                  words):
                </div>
                <div className="aac-board" aria-label="Communication phrase shortcuts">
                  {AAC_PHRASES.map((t) => (
                    <Btn key={t} onClick={() => insertAacPhrase(t)}>
                      {t}
                    </Btn>
                  ))}
                </div>
              </div>
              <div className="formgrid">
                <SelectField
                  id="omethod"
                  label="Evidence method"
                  choices={[...EVIDENCE_METHODS]}
                  defaultValue="direct observation"
                />
                <SelectField
                  id="obasis"
                  label="Evidence basis"
                  choices={[
                    ["observed", "Directly observed"],
                    ["measured", "Measured fact"],
                    ["reported", "Second-hand / community report"],
                    ["assumption", "Assumption / not checked"],
                  ]}
                  defaultValue="observed"
                />
                <div className="field">
                  <label htmlFor="omeasurement">
                    Measurement / specific detail
                  </label>
                  <input
                    id="omeasurement"
                    name="omeasurement"
                    placeholder="e.g. width measured in mm"
                  />
                </div>
                <div className="field">
                  <label htmlFor="osource">Source / observer role</label>
                  <input
                    id="osource"
                    name="osource"
                    placeholder="e.g. community observation"
                  />
                </div>
                <div className="field">
                  <label htmlFor="odate">Observed date *</label>
                  <input
                    type="date"
                    id="odate"
                    name="odate"
                    required
                    defaultValue={todayIsoDate()}
                  />
                </div>
                <div className="field">
                  <label htmlFor="oreviewdate">Review by date</label>
                  <input type="date" id="oreviewdate" name="oreviewdate" />
                </div>
                <SelectField
                  id="oproposed"
                  label="Suggested classification (not published as verified)"
                  choices={[
                    ["unknown", "Unknown"],
                    ["red", "Red — evidenced barrier"],
                    ["amber", "Amber — conditional access"],
                    ["green", "Green — scoped criterion met"],
                  ]}
                  defaultValue="unknown"
                />
              </div>
              <div className="soft">
                <strong>Location and route geometry</strong>
                <p className="small">
                  Use the illustrative map to place markers or enter real
                  latitude/longitude manually. Real-world map tiles are optional
                  and disabled by default.
                </p>
                <div className="formgrid">
                  {(
                    [
                      ["ox", "x", "Illustrative X (%)"],
                      ["oy", "y", "Illustrative Y (%)"],
                      ["olat", "latitude", "Latitude (optional)"],
                      ["olon", "longitude", "Longitude (optional)"],
                      ["ox2", "x2", "Route end X (%)"],
                      ["oy2", "y2", "Route end Y (%)"],
                      ["olat2", "latitude2", "Route end latitude"],
                      ["olon2", "longitude2", "Route end longitude"],
                    ] as const
                  ).map(([id, key, label]) => (
                    <div className="field" key={id}>
                      <label htmlFor={id}>{label}</label>
                      <input
                        type="number"
                        id={id}
                        name={id}
                        step="any"
                        min={
                          key.includes("lat")
                            ? -90
                            : key.includes("lon")
                              ? -180
                              : 0
                        }
                        max={
                          key.includes("lat")
                            ? 90
                            : key.includes("lon")
                              ? 180
                              : 100
                        }
                        value={formCoords[key]}
                        onChange={(e) =>
                          setFormCoords((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={
                          key === "latitude"
                            ? "e.g. -33.86"
                            : key === "longitude"
                              ? "e.g. 151.21"
                              : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="btn-bar" style={{ marginTop: 10 }}>
                  <Btn
                    onClick={() =>
                      setUi((prev) => ({ ...prev, mapPinTarget: "start" }))
                    }
                  >
                    Place start on map
                  </Btn>
                  <Btn
                    onClick={() =>
                      setUi((prev) => ({ ...prev, mapPinTarget: "end" }))
                    }
                  >
                    Place end on map
                  </Btn>
                </div>
                <p className="small">
                  Active marker: <strong>{ui.mapPinTarget}</strong>
                </p>
              </div>
              <div className="field">
                <label htmlFor="oalternative">
                  Alternative path or assistance dependency
                </label>
                <input
                  id="oalternative"
                  name="oalternative"
                  placeholder="Describe known conditions, or say not checked"
                />
              </div>
              <label className="checkline">
                <input
                  type="checkbox"
                  name="alternativeVerified"
                  value="true"
                />
                An alternative was actually reviewed and usable conditionally
              </label>
              <label className="checkline">
                <input
                  type="checkbox"
                  name="noVerifiedAlternative"
                  value="true"
                />
                I checked relevant alternatives and documented that none is
                verified usable
              </label>
              <label className="checkline">
                <input type="checkbox" name="urgentHazard" value="true" />
                Potential urgent safety issue — requires human triage
              </label>
              <label className="checkline">
                <input type="checkbox" name="notApplicable" value="true" />
                Feature not applicable within this scoped observation
              </label>
              <div className="field">
                <label htmlFor="ofile">
                  Upload evidence (optional, stored on this device)
                </label>
                <input
                  id="ofile"
                  name="ofile"
                  type="file"
                  accept="image/*,audio/*,.pdf,.txt"
                  multiple
                />
                <span className="hint">
                  Photos, audio, PDF or text. Max 5 files of 8 MB each. No cloud
                  upload; delete any unwanted files later.
                </span>
              </div>
              <label className="checkline">
                <input type="checkbox" name="confirmLocal" required />I
                understand this observation is saved locally only and I control
                its future export.
              </label>
              <div className="form-actions">
                <button
                  className="btn orange"
                  type="submit"
                  name="submitAs"
                  value="draft"
                >
                  Save draft
                </button>
                <button
                  className="btn"
                  type="submit"
                  name="submitAs"
                  value="submitted"
                >
                  Submit to local review queue
                </button>
              </div>
            </form>
          </div>
          <div className="stack">
            <div className="panel">
              <div className="section-top">
                <h2>Observation map</h2>
              </div>
              <p className="small">
                Synthetic orientation view; clicking blank space sets X/Y in the
                form. These illustrative positions are not geographic
                coordinates.
              </p>
              <SyntheticMap
                items={observeItems}
                editable
                onSelect={openObservation}
                onPlace={placeOnMap}
              />
              <div className="btn-bar" style={{ marginTop: 10 }}>
                {ui.onlineMap ? (
                  <Btn
                    onClick={() => {
                      setUi((prev) => ({ ...prev, onlineMap: false }));
                      showToast("Online map disabled.");
                    }}
                  >
                    Disable online map
                  </Btn>
                ) : (
                  <Btn onClick={enableOnlineMap}>
                    Enable optional OSM tiles
                  </Btn>
                )}
              </div>
              <p className="small">
                If enabled, OpenStreetMap tile requests leave this device and
                disclose the viewed map area to the tile provider. Never enabled
                automatically.
              </p>
              <div
                id="live-map-container"
                hidden={!ui.onlineMap && !mapError}
              >
                {mapError ? (
                  <p role="status">{mapError}</p>
                ) : (
                  <>
                    <div
                      id="live-map"
                      className="live-map"
                      ref={liveMapRef}
                      aria-label="Optional online OpenStreetMap map; use the accompanying latitude and longitude fields as an alternative"
                    />
                    <p className="small">
                      Map data © OpenStreetMap contributors. Use the coordinate
                      fields above if the map does not load or is not
                      accessible.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="panel">
              <h2>Observations for this challenge</h2>
              {observeItems.map((o) => (
                <div className="obs-row" key={o.id}>
                  <strong>{o.title}</strong>
                  <div className="meta">
                    <RatingBadge o={o} /> <Tag word={o.evidenceState} />
                  </div>
                  <p>{o.finding}</p>
                  <Btn onClick={() => openObservation(o.id)}>Inspect</Btn>
                </div>
              ))}
              {!observeItems.length ? <p>No observations yet.</p> : null}
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderObservationDetail() {
    const o = store.observations.find((x) => x.id === ui.selected);
    if (!o) return renderReview();
    const c = store.challenges.find((ch) => ch.id === o.challengeId);
    return (
      <>
        <Heading
          eyebrow="Source & scope"
          title={o.title}
          description={`Feature-level finding · ${c?.title || "Unassigned"}`}
          actions={<Btn onClick={() => goto("observe")}>Back to map</Btn>}
          titleRef={titleRef}
        />
        <Banner />
        <div className="grid two" style={{ alignItems: "start" }}>
          <div className="panel">
            <div className="meta">
              <RatingBadge o={o} /> <Tag word={o.evidenceState} />{" "}
              <Tag word={o.moderation}>{labelCase(o.moderation)}</Tag>{" "}
              {o.isSeed ? <Tag>Synthetic</Tag> : null}
            </div>
            <h2>What is known</h2>
            <dl>
              <dt>
                <strong>Feature</strong>
              </dt>
              <dd>{o.feature}</dd>
              <dt>
                <strong>Evidence basis</strong>
              </dt>
              <dd>{o.claimBasis || "Not stated"}</dd>
              <dt>
                <strong>Functional requirement</strong>
              </dt>
              <dd>{o.requirement}</dd>
              <dt>
                <strong>Observed finding</strong>
              </dt>
              <dd>{o.finding}</dd>
              <dt>
                <strong>Measurement / supporting detail</strong>
              </dt>
              <dd>{o.measurement || "Not recorded"}</dd>
              <dt>
                <strong>Observation method</strong>
              </dt>
              <dd>{o.method || "Not specified"}</dd>
              <dt>
                <strong>Source</strong>
              </dt>
              <dd>{o.source || "Not recorded"}</dd>
              <dt>
                <strong>Observed</strong>
              </dt>
              <dd>{o.observedAt || "Unknown"}</dd>
              <dt>
                <strong>Review due</strong>
              </dt>
              <dd>{o.reviewBy || "Not set"}</dd>
              <dt>
                <strong>Suggested colour, before moderation</strong>
              </dt>
              <dd>{labelCase(o.proposed)}</dd>
              <dt>
                <strong>Alternative path / conditions</strong>
              </dt>
              <dd>{o.alternative || "Not checked"}</dd>
              <dt>
                <strong>Potential urgent hazard</strong>
              </dt>
              <dd>
                {o.urgentHazard
                  ? "Yes — refer for human triage"
                  : "Not flagged (does not prove safety)"}
              </dd>
              <dt>
                <strong>Evidence attachments</strong>
              </dt>
              <dd>{(o.evidenceIds || []).length} file(s)</dd>
              <dt>
                <strong>Local review note</strong>
              </dt>
              <dd>{o.reviewNote || "No review note"}</dd>
            </dl>
            <div className="btn-bar">
              {o.moderation === "draft" || o.moderation === "needs-info" ? (
                <Btn
                  className="btn"
                  onClick={() => updateObservationStatus(o.id, "submitted")}
                >
                  Submit for local review
                </Btn>
              ) : null}
              <Btn onClick={() => updateObservationStatus(o.id, "disputed")}>
                Flag disputed
              </Btn>
              <Btn onClick={() => updateObservationStatus(o.id, "outdated")}>
                Mark outdated
              </Btn>
              <Btn
                className="btn danger sm"
                onClick={() => void deleteObservation(o.id)}
              >
                Withdraw and delete
              </Btn>
            </div>
          </div>
          <div className="stack">
            <div className="panel">
              <h2>Location</h2>
              <SyntheticMap items={[o]} onSelect={openObservation} />
              <p className="small">
                Illustrative X / Y: {o.x ?? "Not set"} / {o.y ?? "Not set"};
                geographic coordinates are private and not exported in redacted
                reports.
              </p>
              <p className="small">
                {o.latitude !== undefined && o.latitude !== ""
                  ? `Latitude: ${fmtNumber(o.latitude)}, longitude: ${fmtNumber(o.longitude)}`
                  : "No real-world coordinates supplied."}
              </p>
            </div>
            <div className="panel">
              <h2>Local evidence files</h2>
              <p className="small">
                Files are stored in this browser using IndexedDB. A public report
                excludes them by default.
              </p>
              {(o.evidenceIds || []).length ? (
                o.evidenceIds.map((k) => (
                  <div className="soft" style={{ marginBottom: 8 }} key={k}>
                    <span>Local attachment: {k.slice(0, 8)}…</span>
                    <Btn
                      onClick={() => {
                        void getEvidenceFile(k)
                          .then((file) =>
                            file
                              ? downloadBlob(file.name, file.blob)
                              : showToast(
                                  "Evidence file no longer available on this device.",
                                ),
                          )
                          .catch(() =>
                            showToast("Evidence storage is unavailable."),
                          );
                      }}
                    >
                      Save file to device
                    </Btn>
                  </div>
                ))
              ) : (
                <div className="empty">
                  No files attached. Recorded measurements and observations may
                  still be useful if reviewed.
                </div>
              )}
            </div>
            <div className="panel">
              <h2>Interpretation rules</h2>
              <p className="small">
                A suggested Green, Amber or Red cannot become a current signal
                until the minimum evidence is present and the observation is
                locally reviewed. Disputed and outdated findings display
                Unknown. This is not a professional assessment or access
                guarantee.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderReview() {
    const pending = store.observations.filter((o) =>
      ["submitted", "needs-info"].includes(o.moderation),
    );
    const o =
      store.observations.find((x) => x.id === ui.selected) ||
      pending[0] ||
      store.observations[0];
    return (
      <>
        <Heading
          eyebrow="3 · Human decision"
          title="Moderation & evidence review"
          description="Review each claim for scope, date, source and evidence; request clarification, record a dispute, or accept a bounded local finding."
          titleRef={titleRef}
        />
        <Banner extra="This prototype has no secure reviewer authentication or independent verification. Any acceptance is a simulated local review, not a publishable certification." />
        <div className="grid two" style={{ alignItems: "start" }}>
          <div className="panel">
            <h2>Review queue ({pending.length})</h2>
            <p className="small">
              Pending and needs-information items appear first. All records
              remain inspectable.
            </p>
            <div className="stack">
              {[
                ...pending,
                ...store.observations.filter((q) => !pending.includes(q)),
              ].map((q) => (
                <div className="soft" key={q.id}>
                  <div className="meta">
                    <RatingBadge o={q} /> <Tag word={q.moderation}>{labelCase(q.moderation)}</Tag>{" "}
                    <Tag word={q.evidenceState} />
                  </div>
                  <strong>{q.title}</strong>
                  <p className="small" style={{ margin: "4px 0" }}>
                    {q.finding.slice(0, 155)}
                  </p>
                  <Btn
                    onClick={() => {
                      setUi((prev) => ({ ...prev, selected: q.id }));
                      requestAnimationFrame(() => {
                        document.getElementById("review-note")?.focus();
                      });
                    }}
                  >
                    Review this item
                  </Btn>
                </div>
              ))}
              {!store.observations.length ? (
                <p>No observations in the workspace.</p>
              ) : null}
            </div>
          </div>
          <div className="panel">
            <h2>
              {o ? `Review: ${o.title}` : "Select an observation"}
            </h2>
            {o ? (
              <>
                <div className="meta">
                  <RatingBadge o={o} /> <Tag word={o.evidenceState} />{" "}
                  {o.isSeed ? <Tag>Synthetic example</Tag> : null}
                </div>
                <p style={{ marginTop: 10 }}>
                  <strong>Finding:</strong> {o.finding}
                </p>
                <p>
                  <strong>Evidence:</strong> {o.measurement || "No measurement"}{" "}
                  · {o.method || "No method"} · {o.observedAt || "No date"}
                </p>
                <p>
                  <strong>Suggested:</strong> {labelCase(o.proposed)}. A
                  suggested colour is not a finding until reviewed.
                </p>
                <p>
                  <strong>Alternative:</strong>{" "}
                  {o.alternative || "Not established"}
                </p>
                <div className="soft">
                  <strong>Review check</strong>
                  <p className="small">
                    {hasEvidence(o)
                      ? "Minimum evidence fields present. A human must still judge relevance and accuracy."
                      : "Minimum evidence incomplete. Approval will be blocked; request more information."}
                  </p>
                </div>
                <form id="review-form" className="stack" onSubmit={handleReview}>
                  <input type="hidden" name="id" value={o.id} />
                  <div className="field">
                    <label htmlFor="review-note">
                      Reviewer reason / limitations *
                    </label>
                    <textarea
                      id="review-note"
                      name="reviewNote"
                      required
                      minLength={12}
                      defaultValue={o.reviewNote || ""}
                      key={o.id}
                      placeholder="Explain the decision and what remains uncertain"
                    />
                  </div>
                  <div className="btn-bar">
                    <Btn
                      type="submit"
                      className="btn"
                      name="decision"
                      value="accept"
                      disabled={!hasEvidence(o)}
                    >
                      Accept local review
                    </Btn>
                    <Btn
                      type="submit"
                      className="btn secondary"
                      name="decision"
                      value="needs-info"
                    >
                      Request clarification
                    </Btn>
                    <Btn
                      type="submit"
                      className="btn secondary"
                      name="decision"
                      value="dispute"
                    >
                      Mark disputed
                    </Btn>
                    <Btn
                      type="submit"
                      className="btn danger"
                      name="decision"
                      value="reject"
                    >
                      Reject report
                    </Btn>
                  </div>
                </form>
                <p className="small">
                  Urgent hazards require a real-world human escalation path and
                  are not handled by this local demonstrator.
                </p>
              </>
            ) : (
              <div className="empty">Create a finding to start review.</div>
            )}
          </div>
        </div>
      </>
    );
  }

  function comparisonCell(o: Observation | undefined) {
    if (!o) {
      return (
        <div className="panel">
          <p>Choose an observation.</p>
        </div>
      );
    }
    return (
      <div className="panel">
        <h3>{o.title}</h3>
        <div className="meta">
          <RatingBadge o={o} /> <Tag word={o.evidenceState} />
        </div>
        <p className="small" style={{ marginTop: 9 }}>
          <strong>Feature:</strong> {o.feature}
          <br />
          <strong>Requirement:</strong> {o.requirement}
        </p>
        <p>
          <strong>Finding:</strong> {o.finding}
        </p>
        <p className="small">
          <strong>Measured detail:</strong> {o.measurement || "No measurement"}
          <br />
          <strong>Basis:</strong> {o.claimBasis || "Not stated"}
          <br />
          <strong>Method:</strong> {o.method}
          <br />
          <strong>Date:</strong> {o.observedAt || "Unknown"}
          <br />
          <strong>Review due:</strong> {o.reviewBy || "Not set"}
          <br />
          <strong>Limitations:</strong> {o.reviewNote || "Not recorded"}
        </p>
        <Btn onClick={() => openObservation(o.id)}>Inspect source</Btn>
      </div>
    );
  }

  function renderCompare() {
    const a =
      store.observations.find((o) => o.id === ui.compareA) ||
      store.observations[0];
    const b =
      store.observations.find((o) => o.id === ui.compareB) ||
      store.observations[1];
    const route = journeyStatus(
      store.observations.filter(
        (o) => o.challengeId === ui.challengeId && o.kind === "journey",
      ),
    );
    const counts = countRatings(store.observations);
    return (
      <>
        <Heading
          eyebrow="4 · Interpret findings"
          title="Compare evidence"
          description="Compare two observations by feature, date and method—not by a universal accessibility score."
          titleRef={titleRef}
        />
        <Banner />
        <div className="panel">
          <div className="formgrid">
            <SelectField
              id="compareA"
              label="Finding A"
              choices={store.observations.map((o) => [o.id, o.title])}
              value={a?.id || ""}
              onChange={(v) => {
                setUi((prev) => ({ ...prev, compareA: v }));
              }}
            />
            <SelectField
              id="compareB"
              label="Finding B"
              choices={store.observations.map((o) => [o.id, o.title])}
              value={b?.id || ""}
              onChange={(v) => {
                setUi((prev) => ({ ...prev, compareB: v }));
              }}
            />
          </div>
        </div>
        <div className="grid two" style={{ marginTop: 15 }}>
          <div className="compare-cell">{comparisonCell(a)}</div>
          <div className="compare-cell">{comparisonCell(b)}</div>
        </div>
        <div className="grid two" style={{ marginTop: 15 }}>
          <div className="panel">
            <h2>Selected route check</h2>
            <SelectField
              id="routeChallenge"
              label="Challenge"
              choices={store.challenges.map((c) => [c.id, c.title])}
              value={ui.challengeId}
              onChange={(v) => setUi((prev) => ({ ...prev, challengeId: v }))}
            />
            <div style={{ marginTop: 12 }}>
              <Tag word={route.rating} />
              <p className="small" style={{ marginTop: 8 }}>
                {route.reason}
              </p>
            </div>
            <p className="small">
              Route-level classification is conservative. Red only applies to the
              defined functional requirement and the known lack of a verified
              alternative. Missing evidence blocks a Green route.
            </p>
          </div>
          <div className="panel">
            <h2>Evidence completeness</h2>
            <p>
              To help contributors improve a finding, record the method, observed
              date, measurement or specific detail, source, scope and any
              alternative. Local review cannot establish statutory compliance or
              universal access.
            </p>
            <div className="legend">
              {(["red", "amber", "green", "unknown"] as const).map((k) => (
                <span key={k}>
                  <Tag word={k} /> {counts[k]}{" "}
                </span>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderReports() {
    const counts = countRatings(store.observations);
    return (
      <>
        <Heading
          eyebrow="5 · Export with control"
          title="Reports & export"
          description="Inspect the scope, uncertainty and privacy of a report before saving it. Nothing is automatically published."
          titleRef={titleRef}
        />
        <Banner />
        <div className="grid two">
          <div className="panel">
            <h2>Generate a report</h2>
            <div className="stack">
              <SelectField
                id="reportChallenge"
                label="Scope"
                choices={[
                  ["all", "All challenges"],
                  ...store.challenges.map((c) => [c.id, c.title] as [string, string]),
                ]}
                value={ui.reportChallenge || "all"}
                onChange={(v) =>
                  setUi((prev) => ({ ...prev, reportChallenge: v }))
                }
              />
              <label className="checkline">
                <input
                  id="export-location"
                  type="checkbox"
                  checked={store.consents.includeLocation}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const checked = e.target.checked;
                    updateStore((prev) => ({
                      ...prev,
                      consents: {
                        ...prev.consents,
                        includeLocation: checked,
                      },
                    }));
                    audit(
                      "Private export preference changed",
                      `includeLocation = ${checked}`,
                    );
                  }}
                />
                Include exact coordinates in private exports
              </label>
              <label className="checkline">
                <input
                  id="export-evidence"
                  type="checkbox"
                  checked={store.consents.includeEvidence}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const checked = e.target.checked;
                    updateStore((prev) => ({
                      ...prev,
                      consents: {
                        ...prev.consents,
                        includeEvidence: checked,
                      },
                    }));
                    audit(
                      "Private export preference changed",
                      `includeEvidence = ${checked}`,
                    );
                  }}
                />
                Include local evidence files inside private JSON export (large /
                sensitive)
              </label>
              <div className="soft">
                <strong>Privacy preset: redacted by default</strong>
                <p className="small">
                  Structured private fields and file payloads are omitted by
                  default, but free-text notes are NOT automatically anonymised.
                  Review each export before sharing. Private export options
                  require explicit selection.
                </p>
              </div>
              <div className="btn-bar">
                <Btn className="btn" onClick={exportCsv}>
                  Export redacted CSV
                </Btn>
                <Btn
                  className="btn secondary"
                  onClick={() => {
                    void exportJson().catch(() =>
                      showToast("Unable to build the requested JSON export."),
                    );
                  }}
                >
                  Export JSON
                </Btn>
                <Btn className="btn secondary" onClick={exportHtml}>
                  Download HTML report
                </Btn>
                <Btn className="btn secondary" onClick={printReport}>
                  Print / Save PDF
                </Btn>
              </div>
            </div>
          </div>
          <div className="panel">
            <h2>Summary of evidence</h2>
            <div className="grid two">
              {Object.entries(counts).map(([k, v]) => (
                <div className="soft" key={k}>
                  <Tag word={k === "notApplicable" ? "not-applicable" : k}>
                    {k === "notApplicable" ? "Not Applicable" : labelCase(k)}
                  </Tag>
                  <strong style={{ display: "block", fontSize: "1.55rem" }}>
                    {v}
                  </strong>
                </div>
              ))}
            </div>
            <p className="small" style={{ marginTop: 12 }}>
              Counts are of scoped observations, not people, places or compliant
              journeys. No accreditation, regulation or access guarantee is
              inferred.
            </p>
          </div>
        </div>
        <div className="section-top">
          <h2>Included observations</h2>
        </div>
        <div id="report-table">
          <ObservationTable
            items={reportObservations}
            onInspect={openObservation}
          />
        </div>
      </>
    );
  }

  function renderPrivacy() {
    return (
      <>
        <Heading
          eyebrow="Your information"
          title="Privacy, consent & communication access"
          description="The participant controls what to collect, keep, review, export and erase. Remote submissions are not enabled."
          titleRef={titleRef}
        />
        <Banner />
        <div className="grid two">
          <div className="panel">
            <h2>Data and consent controls</h2>
            <div className="stack">
              <div className="soft">
                <strong>Local storage</strong>
                <p className="small">
                  Challenge and observation records are stored in this browser.
                  Evidence files are stored separately in IndexedDB. Anyone with
                  access to this browser profile may be able to inspect them.
                  This is not encrypted secure case-management storage.
                </p>
              </div>
              <label className="checkline">
                <input
                  id="privacy-coords"
                  type="checkbox"
                  checked={store.consents.includeLocation}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateStore((prev) => ({
                      ...prev,
                      consents: {
                        ...prev.consents,
                        includeLocation: checked,
                      },
                    }));
                    audit(
                      "Private export preference changed",
                      `includeLocation = ${checked}`,
                    );
                  }}
                />
                Allow geographic coordinates in my private downloads (off by
                default)
              </label>
              <label className="checkline">
                <input
                  id="privacy-evidence"
                  type="checkbox"
                  checked={store.consents.includeEvidence}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateStore((prev) => ({
                      ...prev,
                      consents: {
                        ...prev.consents,
                        includeEvidence: checked,
                      },
                    }));
                    audit(
                      "Private export preference changed",
                      `includeEvidence = ${checked}`,
                    );
                  }}
                />
                Allow attachments in my private JSON downloads (off by default)
              </label>
              <p className="small">
                Consent for external publication, analytics, marketing, AI
                processing, location tracking or organisation sharing has not
                been requested and is not available in this build.
              </p>
              <div className="btn-bar">
                <Btn
                  className="btn"
                  onClick={() => {
                    void exportJson().catch(() =>
                      showToast("Unable to build the requested JSON export."),
                    );
                  }}
                >
                  Export my workspace
                </Btn>
                <Btn
                  className="btn danger"
                  onClick={() => void wipeWorkspace()}
                >
                  Erase entire local workspace
                </Btn>
              </div>
            </div>
          </div>
          <div className="panel">
            <h2>Accessible display &amp; AAC</h2>
            <label className="checkline">
              <input
                id="pref-contrast"
                type="checkbox"
                checked={store.prefs.highContrast}
                onChange={(e) => {
                  updateStore((prev) => ({
                    ...prev,
                    prefs: { ...prev.prefs, highContrast: e.target.checked },
                  }));
                  audit(
                    "Communication/display preference changed",
                    "highContrast",
                  );
                }}
              />
              High-contrast colours
            </label>
            <label className="checkline">
              <input
                id="pref-large"
                type="checkbox"
                checked={store.prefs.largeText}
                onChange={(e) => {
                  updateStore((prev) => ({
                    ...prev,
                    prefs: { ...prev.prefs, largeText: e.target.checked },
                  }));
                  audit(
                    "Communication/display preference changed",
                    "largeText",
                  );
                }}
              />
              Larger text
            </label>
            <label className="checkline">
              <input
                id="pref-easy"
                type="checkbox"
                checked={store.prefs.easyRead}
                onChange={(e) => {
                  updateStore((prev) => ({
                    ...prev,
                    prefs: { ...prev.prefs, easyRead: e.target.checked },
                  }));
                  audit(
                    "Communication/display preference changed",
                    "easyRead",
                  );
                }}
              />
              Easy-read / more spacious controls
            </label>
            <p className="small">
              Keyboard navigation, visible focus, text alternatives to map
              markers, plain-language prompts and an AAC phrase board are
              included. Manual assistive-technology acceptance testing is still
              required.
            </p>
            <p className="small">
              If speech is difficult, you can type or use AAC shortcuts. No
              diagnosis, impairment label or disability proof is required.
            </p>
          </div>
        </div>
        <div className="panel" style={{ marginTop: 15 }}>
          <h2>Governance boundaries</h2>
          <p>
            <strong>Local review is not identity verification.</strong> This
            standalone build does not have accounts, delegated permissions,
            server-side moderation, encrypted uploads or published public
            records. The audit trail shows local actions but can be cleared or
            modified by someone with browser access.
          </p>
          <p>
            Before real community publishing: implement secure authentication,
            least-privilege human review, participant correction and deletion
            rights, legally reviewed consent and retention, evidence licensing,
            abuse triage and escalation, tested accessibility, and explicit
            opt-in release controls.
          </p>
        </div>
      </>
    );
  }

  function renderAudit() {
    return (
      <>
        <Heading
          eyebrow="Changes & reasoning"
          title="Local audit trail"
          description="A timeline of changes in this device. Useful for review and transparency, but not a tamper-proof compliance record."
          titleRef={titleRef}
        />
        <Banner />
        <div className="panel">
          <div className="section-top">
            <h2>{store.audit.length} recorded events</h2>
            <Btn
              onClick={() =>
                exportText(
                  `${reportName()}-audit.json`,
                  JSON.stringify(
                    {
                      notice: "Local record, not tamper-proof",
                      events: store.audit,
                    },
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              Export audit JSON
            </Btn>
          </div>
          {store.audit.map((a) => (
            <div className="audit-entry" key={a.id}>
              <strong>{a.action}</strong>
              <time dateTime={a.at}>
                {timeText(a.at)} · {a.actor}
              </time>
              <p className="small">{a.detail}</p>
            </div>
          ))}
          {!store.audit.length ? (
            <div className="empty">No events yet.</div>
          ) : null}
        </div>
      </>
    );
  }

  function renderView(): ReactNode {
    switch (ui.view) {
      case "overview":
        return renderOverview();
      case "challenges":
        return renderChallenges();
      case "challenge-detail":
        return renderChallengeDetail();
      case "observe":
        return renderObserve();
      case "review":
        return renderReview();
      case "observation-detail":
        return renderObservationDetail();
      case "compare":
        return renderCompare();
      case "reports":
        return renderReports();
      case "privacy":
        return renderPrivacy();
      case "audit":
        return renderAudit();
      default: {
        const _exhaustive: never = ui.view;
        return _exhaustive;
      }
    }
  }

  const navCurrent = (view: SignalView): boolean => {
    if (view === "challenges" && ui.view === "challenge-detail") return true;
    if (view === "observe" && ui.view === "observation-detail") return true;
    if (view === "review" && ui.view === "observation-detail") return false;
    return ui.view === view;
  };

  return (
    <div className={rootClassName(store.prefs)}>
      <a href="#signal-sites-main" className="skip-link">
        Skip to main content
      </a>
      <div
        role="status"
        style={{
          margin: 0,
          padding: "0.85rem 1.25rem",
          background: "#fff6eb",
          borderBottom: "4px solid #d57623",
          color: "#162c44",
          font: "16px system-ui, Arial, sans-serif",
        }}
      >
        <strong>Prototype only.</strong> This is not a live MapAble deployment.
        Seed challenges and observations are fictional. Data stays in this
        browser — do not invite real participants or treat signals as
        certification.
      </div>
      {storageError ? (
        <p role="alert" className="p-4" style={{ background: "#fff1d6", color: "#6d2600", fontWeight: 700 }}>
          {storageError}
        </p>
      ) : null}
      <div className="shell">
        <aside className="sidebar" aria-label="Main navigation">
          <div className="brand">
            <div className="brand-symbol" aria-hidden="true">
              M
            </div>
            <div>
              <strong>
                MapAble <span style={{ color: "#ffa15c" }}>Signal</span>
              </strong>
              <small>Australian Disability Ltd</small>
            </div>
          </div>
          <nav className="nav-menu" aria-label="App sections">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                type="button"
                aria-current={navCurrent(item.view) ? "page" : undefined}
                onClick={() => goto(item.view)}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-foot">
            <b>Access Signals v0.1</b>
            <div>Synthetic / local-only by default</div>
            <div>R · A · G · Unknown</div>
            <div style={{ marginTop: 8 }}>
              No accreditation or compliance certification
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div>
              <strong style={{ color: "#1d3454" }}>
                Community Mapping Challenges
              </strong>
              <div className="caption">
                Collect evidence. Make uncertainty visible. Keep people in
                control.
              </div>
            </div>
            <div className="top-actions">
              <span className="workspace-badge">● Local-only workspace</span>
              <Btn
                onClick={() => {
                  void exportJson().catch(() =>
                    showToast("Unable to build the requested JSON export."),
                  );
                }}
              >
                Export data
              </Btn>
            </div>
          </header>
          <main id="signal-sites-main" className="content">
            {!hydrated ? (
              <p style={{ padding: "2rem" }}>Loading MapAble Signal…</p>
            ) : (
              renderView()
            )}
            <footer className="footer-disclaimer">
              MapAble Signal · community evidence-support demo · Red, Amber,
              Green &amp; Unknown are contextual signals, not accreditation,
              legal findings or guaranteed access. No public network submission
              is performed.
            </footer>
          </main>
        </div>
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
