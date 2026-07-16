"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AccessPassport, AccessRequirement } from "@/lib/access-intelligence/schemas";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const FEATURE_HELP: Record<string, string> = {
  step_free: "Required step-free blocks any route with steps.",
  clear_door_width_mm: "Compared as a minimum clear opening against measured doors.",
  lift_door_width_mm: "Compared against lift car or lift door clear width.",
  corridor_width_mm: "Compared against corridor clear width on the route.",
  lift: "Requires an available lift edge when moving between levels.",
  accessible_toilet: "Preferred or required toilet availability at the place.",
  changing_places: "Specialist Changing Places facility — absence yields unknown or blocked.",
  quiet_waiting_area: "Affects preference fit; does not block unless marked required.",
  hearing_augmentation: "Hearing loop or similar — venue attestation alone lowers confidence.",
  assistance_animal_access: "Assistance animal welcome policy.",
};

function requirementEffect(req: AccessRequirement): string {
  const base =
    FEATURE_HELP[req.featureType] ??
    "Used in deterministic matching; missing evidence becomes an unknown for required items.";
  if (req.importance === "required") {
    return `${base} Importance: required (hard gate).`;
  }
  if (req.importance === "preferred") {
    return `${base} Importance: preferred (affects personal fit, not a blocker).`;
  }
  return `${base} Importance: helpful (light weight on personal fit).`;
}

export function AccessPassportEditor() {
  const [passports, setPassports] = useState<AccessPassport[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<AccessPassport | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/access-intelligence/passport");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load passports");
      setPassports(data.passports ?? []);
      const initial =
        data.passports?.find((p: AccessPassport) => p.isDefault) ??
        data.passports?.[0];
      if (initial) {
        setSelectedId(initial.id);
        setDraft(structuredClone(initial));
        setDirty(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load passports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const selected = draft;

  const templates = useMemo(
    () => [
      "passport-step-free",
      "passport-power-chair",
      "passport-sensory",
      "passport-vision",
      "passport-hearing",
      "passport-fatigue",
      "passport-animal",
    ],
    [],
  );

  const updateDraft = (next: AccessPassport) => {
    setDraft(next);
    setDirty(true);
  };

  const save = async () => {
    if (!draft) return;
    setStatus(null);
    setError(null);
    const res = await fetch("/api/access-intelligence/passport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passport: draft }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setDirty(false);
    setStatus("Passport saved.");
    await load();
    setSelectedId(data.passport.id);
    setDraft(structuredClone(data.passport));
  };

  const runAction = async (body: Record<string, unknown>) => {
    if (dirty && !window.confirm("You have unsaved changes. Continue and discard them?")) {
      return;
    }
    const res = await fetch("/api/access-intelligence/passport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Action failed");
      return;
    }
    setDirty(false);
    await load();
    if (data.passport) {
      setSelectedId(data.passport.id);
      setDraft(structuredClone(data.passport));
    }
  };

  if (loading) {
    return <p role="status">Loading Access Passports…</p>;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm" role="status">
          {status}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <label className="text-sm font-semibold">
          Passport
          <select
            className={`ml-2 min-h-11 rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
            value={selectedId}
            onChange={(e) => {
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              const p = passports.find((x) => x.id === e.target.value);
              setSelectedId(e.target.value);
              setDraft(p ? structuredClone(p) : null);
              setDirty(false);
            }}
          >
            {passports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Button variant="default" size="default" type="button" onClick={() => void save()} disabled={!dirty}>
          Save
        </Button>
        <Button size="default"
          type="button"
          variant="outline"
          onClick={() =>
            void runAction({
              action: "duplicate",
              passportId: selectedId,
              name: `${selected?.name ?? "Passport"} (copy)`,
            })
          }
        >
          Duplicate
        </Button>
        <Button size="default"
          type="button"
          variant="outline"
          onClick={() => void runAction({ action: "setDefault", passportId: selectedId })}
        >
          Set default
        </Button>
      </div>

      <section aria-labelledby="templates-heading">
        <h2 id="templates-heading" className="text-lg font-black">
          Templates
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Templates are editable starting points. They do not imply that everyone with a
          similar disability has identical needs.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {templates.map((id) => (
            <li key={id}>
              <Button size="default"
                type="button"
                variant="secondary"
                onClick={() =>
                  void runAction({ action: "createFromTemplate", templateId: id })
                }
              >
                {id.replace("passport-", "").replaceAll("-", " ")}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {selected ? (
        <section aria-labelledby="editor-heading" className="space-y-4">
          <h2 id="editor-heading" className="text-lg font-black">
            Edit passport
          </h2>
          <label className="block text-sm font-semibold">
            Name
            <input
              className={`mt-1 w-full min-h-11 rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
              value={selected.name}
              onChange={(e) => updateDraft({ ...selected, name: e.target.value })}
            />
          </label>

          <AccessRequirementFieldList
            requirements={selected.requirements}
            onChange={(requirements) => updateDraft({ ...selected, requirements })}
          />
        </section>
      ) : null}
    </div>
  );
}

function AccessRequirementFieldList({
  requirements,
  onChange,
}: {
  requirements: AccessRequirement[];
  onChange: (next: AccessRequirement[]) => void;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const next = [...requirements];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index]!;
    next[index] = next[target]!;
    next[target] = tmp;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black">Requirements</h3>
        <Button size="default"
          type="button"
          variant="outline"
          onClick={() =>
            onChange([
              ...requirements,
              {
                id: `req-${Date.now()}`,
                featureType: "step_free",
                importance: "preferred",
                operator: "available",
                value: true,
                shareWithVenue: false,
              },
            ])
          }
        >
          Add requirement
        </Button>
      </div>
      <ul className="space-y-3">
        {requirements.map((req, index) => (
          <li key={req.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold">
                Feature
                <select
                  className={`mt-1 w-full min-h-11 rounded-xl border px-3 ${mapableCareFocusRing}`}
                  value={req.featureType}
                  onChange={(e) => {
                    const next = [...requirements];
                    next[index] = {
                      ...req,
                      featureType: e.target.value as AccessRequirement["featureType"],
                    };
                    onChange(next);
                  }}
                >
                  {[
                    "step_free",
                    "clear_door_width_mm",
                    "lift_door_width_mm",
                    "corridor_width_mm",
                    "lift",
                    "accessible_toilet",
                    "changing_places",
                    "quiet_waiting_area",
                    "hearing_augmentation",
                    "assistance_animal_access",
                    "staff_assistance",
                  ].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Importance
                <select
                  className={`mt-1 w-full min-h-11 rounded-xl border px-3 ${mapableCareFocusRing}`}
                  value={req.importance}
                  onChange={(e) => {
                    const next = [...requirements];
                    next[index] = {
                      ...req,
                      importance: e.target.value as AccessRequirement["importance"],
                    };
                    onChange(next);
                  }}
                >
                  <option value="required">required</option>
                  <option value="preferred">preferred</option>
                  <option value="helpful">helpful</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                Operator
                <select
                  className={`mt-1 w-full min-h-11 rounded-xl border px-3 ${mapableCareFocusRing}`}
                  value={req.operator}
                  onChange={(e) => {
                    const next = [...requirements];
                    next[index] = {
                      ...req,
                      operator: e.target.value as AccessRequirement["operator"],
                    };
                    onChange(next);
                  }}
                >
                  <option value="available">available</option>
                  <option value="minimum">minimum</option>
                  <option value="maximum">maximum</option>
                  <option value="equals">equals</option>
                  <option value="includes">includes</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                Value
                <input
                  className={`mt-1 w-full min-h-11 rounded-xl border px-3 ${mapableCareFocusRing}`}
                  value={String(req.value)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const asNum = Number(raw);
                    const value =
                      raw === "true"
                        ? true
                        : raw === "false"
                          ? false
                          : Number.isFinite(asNum) && raw.trim() !== ""
                            ? asNum
                            : raw;
                    const next = [...requirements];
                    next[index] = { ...req, value };
                    onChange(next);
                  }}
                />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={req.shareWithVenue}
                onChange={(e) => {
                  const next = [...requirements];
                  next[index] = { ...req, shareWithVenue: e.target.checked };
                  onChange(next);
                }}
              />
              Share with venue when approved
            </label>
            <p className="mt-2 text-sm text-slate-600">{requirementEffect(req)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="default" type="button" variant="outline" onClick={() => move(index, -1)}>
                Move up
              </Button>
              <Button size="default" type="button" variant="outline" onClick={() => move(index, 1)}>
                Move down
              </Button>
              <Button size="default"
                type="button"
                variant="destructive"
                onClick={() => onChange(requirements.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { AccessRequirementFieldList as AccessRequirementField };
