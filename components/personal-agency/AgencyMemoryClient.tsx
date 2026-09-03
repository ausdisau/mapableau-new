"use client";

import { useCallback, useEffect, useState } from "react";

type PresentationItem = {
  memoryId: string;
  statement: string;
  categoryLabel: string;
  state: string;
  why: string;
  whereUsed: string;
  whoCanSee: string;
  source: string;
  editable: boolean;
  deletable: boolean;
};

type Snapshot = {
  presentation: {
    title: string;
    summary: string;
    sections: Array<{
      id: string;
      title: string;
      body: string;
      items?: PresentationItem[];
    }>;
    controls: {
      personalisationPaused: boolean;
      aiUseDisabled: boolean;
      note: string;
    };
  };
  controls: {
    personalisationPaused: boolean;
    aiUseDisabled: boolean;
  };
};

const focusRing =
  "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50";

export function AgencyMemoryClient() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const [newStatement, setNewStatement] = useState("");
  const [newCategory, setNewCategory] = useState("communication");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/ai/agency-memory");
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not load Agency Memory.");
      setSnapshot(null);
      return;
    }
    setSnapshot((await res.json()) as Snapshot);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function postJson(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Request failed.");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/agency-memory/export");
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Export failed.");
        return;
      }
      const data = (await res.json()) as { humanReadable: string };
      setExportText(data.humanReadable);
    } finally {
      setBusy(false);
    }
  }

  if (error && !snapshot) {
    return (
      <div className="space-y-4" role="alert">
        <p className="text-sm text-red-800">{error}</p>
        <p className="text-sm text-slate-600">
          Agency Memory may be turned off. You can still manage other privacy
          settings from Privacy &amp; control.
        </p>
      </div>
    );
  }

  if (!snapshot) {
    return <p className="text-sm text-slate-600">Loading your preferences…</p>;
  }

  const { presentation, controls } = snapshot;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold">{presentation.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {presentation.summary}
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section
        aria-labelledby="controls-heading"
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <h2 id="controls-heading" className="text-lg font-bold">
          Agency Memory controls
        </h2>
        <p className="mt-2 text-sm text-slate-600">{presentation.controls.note}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            className={`min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold ${focusRing}`}
            onClick={() =>
              void postJson("/api/ai/agency-memory/controls", {
                personalisationPaused: !controls.personalisationPaused,
              })
            }
          >
            {controls.personalisationPaused
              ? "Resume personalisation"
              : "Pause personalisation"}
          </button>
          <button
            type="button"
            disabled={busy}
            className={`min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold ${focusRing}`}
            onClick={() =>
              void postJson("/api/ai/agency-memory/controls", {
                aiUseDisabled: !controls.aiUseDisabled,
              })
            }
          >
            {controls.aiUseDisabled ? "Allow AI use again" : "Disable AI use"}
          </button>
          <button
            type="button"
            disabled={busy}
            className={`min-h-11 rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white ${focusRing}`}
            onClick={() => void handleExport()}
          >
            Export confirmed memory
          </button>
        </div>
        {exportText ? (
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-slate-50 p-4 text-xs whitespace-pre-wrap">
            {exportText}
          </pre>
        ) : null}
      </section>

      <section
        aria-labelledby="add-pref-heading"
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <h2 id="add-pref-heading" className="text-lg font-bold">
          Add a preference
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Only what you write here is saved. MapAble does not invent preferences.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void postJson("/api/ai/agency-memory", {
              category: newCategory,
              statement: newStatement,
              source: "participant_explicit",
              consentScopes: ["profile.write"],
              autoConfirmIfParticipantExplicit: true,
              ...(newCategory === "disclosure" || newCategory === "jobs"
                ? { purpose: "participant_stated" }
                : {}),
            }).then(() => setNewStatement(""));
          }}
        >
          <label className="block text-sm font-semibold" htmlFor="mem-category">
            Category
          </label>
          <select
            id="mem-category"
            className={`min-h-11 w-full max-w-md rounded-lg border border-slate-300 px-3 ${focusRing}`}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            <option value="communication">Communication</option>
            <option value="access">Access</option>
            <option value="care">Care</option>
            <option value="transport">Transport</option>
            <option value="jobs">Work</option>
            <option value="provider_preference">Preferred providers</option>
            <option value="provider_exclusion">Excluded providers</option>
            <option value="privacy">Privacy</option>
            <option value="disclosure">Disclosure</option>
            <option value="interaction">Interaction</option>
            <option value="mission_preference">Mission preferences</option>
          </select>
          <label className="block text-sm font-semibold" htmlFor="mem-statement">
            What should MapAble remember?
          </label>
          <textarea
            id="mem-statement"
            required
            maxLength={1000}
            rows={3}
            className={`w-full max-w-xl rounded-lg border border-slate-300 px-3 py-2 text-sm ${focusRing}`}
            value={newStatement}
            onChange={(e) => setNewStatement(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !newStatement.trim()}
            className={`min-h-11 rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${focusRing}`}
          >
            Save preference
          </button>
        </form>
      </section>

      {presentation.sections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`section-${section.id}`}
          className="space-y-3"
        >
          <h2 id={`section-${section.id}`} className="text-lg font-bold">
            {section.title}
          </h2>
          <p className="text-sm text-slate-600">{section.body}</p>
          {section.items?.length ? (
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li
                  key={`${section.id}-${item.memoryId}`}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="font-semibold">{item.statement}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.categoryLabel} · {item.state}
                  </p>
                  <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-[#005B7F]">Why</dt>
                      <dd>{item.why}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#005B7F]">Where used</dt>
                      <dd>{item.whereUsed}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#005B7F]">Who can see</dt>
                      <dd>{item.whoCanSee}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#005B7F]">Source</dt>
                      <dd>{item.source}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.state === "proposed" ? (
                      <button
                        type="button"
                        disabled={busy}
                        className={`min-h-11 rounded-lg bg-[#005B7F] px-3 py-2 text-sm font-semibold text-white ${focusRing}`}
                        onClick={() =>
                          void postJson("/api/ai/agency-memory/confirm", {
                            memoryId: item.memoryId,
                          })
                        }
                      >
                        Confirm
                      </button>
                    ) : null}
                    {item.state === "confirmed" ? (
                      <button
                        type="button"
                        disabled={busy}
                        className={`min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold ${focusRing}`}
                        onClick={() =>
                          void postJson("/api/ai/agency-memory/revoke", {
                            memoryId: item.memoryId,
                          })
                        }
                      >
                        Revoke
                      </button>
                    ) : null}
                    {item.deletable ? (
                      <button
                        type="button"
                        disabled={busy}
                        className={`min-h-11 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 ${focusRing}`}
                        onClick={() =>
                          void postJson("/api/ai/agency-memory/delete", {
                            memoryId: item.memoryId,
                          })
                        }
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : section.items ? (
            <p className="text-sm text-slate-600">Nothing stored here yet.</p>
          ) : null}
        </section>
      ))}
    </div>
  );
}
