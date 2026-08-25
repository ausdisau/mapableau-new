"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  ACCESS_CRITICALITIES,
  ACCESS_DISCLOSURE_SCOPES,
  ACCESS_DOMAIN_LABELS,
  ACCESS_DOMAINS,
  COMMON_ACCESS_CONCEPTS,
  CRITICALITY_LABELS,
  DISCLOSURE_SCOPE_LABELS,
  FIRST_RUN_CONCEPT_IDS,
  VISIBILITY_LABELS,
  labelForConceptId,
  type AccessDomain,
  type PassportVisibilityDefault,
} from "@/lib/access/infrastructure";

export type MyAccessRequirement = {
  id: string;
  ontologyConceptId: string;
  domain: AccessDomain;
  attribute: string;
  comparator?: string;
  value?: string | number | boolean;
  unit?: string | null;
  criticality: "required" | "strong_preference" | "preference";
  contextScope: "always" | "activity_specific" | "journey_specific";
  timing: "permanent" | "temporary" | "fluctuating";
  assistance: "independent" | "optional" | "required";
  disclosureScopes: string[];
  userConfirmed: boolean;
  notes?: string;
};

const UI_SECTIONS: Array<{ title: string; domains: AccessDomain[] }> = [
  { title: "Movement", domains: ["mobility_movement", "reach_strength_dexterity"] },
  { title: "Communication", domains: ["speech_communication", "auslan_language"] },
  { title: "Vision", domains: ["vision"] },
  { title: "Hearing", domains: ["hearing"] },
  {
    title: "Thinking & information",
    domains: ["cognition_learning", "executive_memory"],
  },
  { title: "Sensory environment", domains: ["sensory_regulation"] },
  {
    title: "Fatigue & stamina",
    domains: ["seating_stamina", "pain_fatigue_fluctuating"],
  },
  {
    title: "Personal support",
    domains: ["psychosocial", "assistance_animals", "equipment_at"],
  },
  { title: "Transport", domains: ["transport"] },
  { title: "Toilets", domains: ["self_care_continence"] },
  { title: "Technology", domains: ["digital"] },
  { title: "Emergency access", domains: ["emergency"] },
  {
    title: "Service & admin",
    domains: ["service_staff", "financial_admin"],
  },
];

export function MyAccessForm({
  initialRequirements,
  visibilityDefault,
}: {
  initialRequirements: MyAccessRequirement[];
  visibilityDefault: PassportVisibilityDefault;
}) {
  const router = useRouter();
  const [requirements, setRequirements] =
    useState<MyAccessRequirement[]>(initialRequirements);
  const [visibility, setVisibility] =
    useState<PassportVisibilityDefault>(visibilityDefault);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [addConceptId, setAddConceptId] = useState(
    COMMON_ACCESS_CONCEPTS[0]!.ontologyConceptId,
  );
  const [addCriticality, setAddCriticality] =
    useState<(typeof ACCESS_CRITICALITIES)[number]>("required");

  const byDomain = useMemo(() => {
    const map = new Map<AccessDomain, MyAccessRequirement[]>();
    for (const d of ACCESS_DOMAINS) map.set(d, []);
    for (const r of requirements) {
      map.get(r.domain)?.push(r);
    }
    return map;
  }, [requirements]);

  const firstRunConcepts = useMemo(
    () =>
      FIRST_RUN_CONCEPT_IDS.map((id) =>
        COMMON_ACCESS_CONCEPTS.find((c) => c.ontologyConceptId === id),
      ).filter((c): c is (typeof COMMON_ACCESS_CONCEPTS)[number] => Boolean(c)),
    [],
  );

  async function save(
    next: MyAccessRequirement[],
    nextVisibility = visibility,
    successMessage = "Saved. You control what is shared.",
  ) {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/access-infrastructure/passport", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1.0",
          visibilityDefault: nextVisibility,
          requirements: next.map((r) => ({
            id: r.id.startsWith("tmp_") ? undefined : r.id,
            ontologyConceptId: r.ontologyConceptId,
            domain: r.domain,
            attribute: r.attribute,
            comparator: r.comparator,
            value: r.value,
            unit: r.unit,
            criticality: r.criticality,
            contextScope: r.contextScope,
            timing: r.timing,
            assistance: r.assistance,
            disclosureScopes: r.disclosureScopes,
            userConfirmed: true,
            notes: r.notes,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save My Access. Please try again.");
        return;
      }
      setRequirements(
        (data.passport.requirements as MyAccessRequirement[]).map((r) => ({
          ...r,
          disclosureScopes: r.disclosureScopes ?? ["private"],
        })),
      );
      setStatus(successMessage);
      router.refresh();
    } catch {
      setError("Could not save My Access. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function addRequirementFromConcept(
    conceptId: string,
    criticality: (typeof ACCESS_CRITICALITIES)[number] = addCriticality,
  ) {
    setAddError("");
    setError("");
    const concept = COMMON_ACCESS_CONCEPTS.find(
      (c) => c.ontologyConceptId === conceptId,
    );
    if (!concept) {
      setAddError("Choose an access need to add.");
      return;
    }
    if (requirements.some((r) => r.ontologyConceptId === concept.ontologyConceptId)) {
      setError("That access need is already on your passport.");
      return;
    }
    const next: MyAccessRequirement = {
      id: `tmp_${crypto.randomUUID()}`,
      ontologyConceptId: concept.ontologyConceptId,
      domain: concept.domain,
      attribute: concept.attribute,
      comparator: concept.defaultComparator ?? "eq",
      value: concept.defaultValue,
      unit: concept.unit ?? null,
      criticality,
      contextScope: "always",
      timing: "permanent",
      assistance: "independent",
      disclosureScopes: ["private"],
      userConfirmed: true,
    };
    const updated = [...requirements, next];
    setRequirements(updated);
    void save(updated, visibility, "Added. You control what is shared.");
  }

  function addRequirement() {
    addRequirementFromConcept(addConceptId, addCriticality);
  }

  async function removeRequirement(id: string) {
    const target = requirements.find((r) => r.id === id);
    if (!target) return;
    if (id.startsWith("tmp_")) {
      setRequirements((prev) => prev.filter((r) => r.id !== id));
      setConfirmRemoveId(null);
      setStatus("Removed.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/access-infrastructure/passport", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1.0",
          requirements: [
            {
              id,
              ontologyConceptId: target.ontologyConceptId,
              domain: target.domain,
              attribute: target.attribute,
              criticality: target.criticality,
              _delete: true,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not remove that need.");
        return;
      }
      setRequirements(data.passport.requirements);
      setConfirmRemoveId(null);
      setStatus("Removed.");
      router.refresh();
    } catch {
      setError("Could not remove that need. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function updateLocal(id: string, patch: Partial<MyAccessRequirement>) {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  return (
    <div className="space-y-8" aria-busy={loading || undefined}>
      <div
        role="status"
        aria-live="polite"
        className="min-h-[1.25rem] text-sm text-muted-foreground"
      >
        {status}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section
        aria-labelledby="my-access-sharing-heading"
        className="space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <h2 id="my-access-sharing-heading" className="font-heading text-lg font-semibold">
          Sharing
        </h2>
        <p className="text-sm text-muted-foreground">
          Functional access information only — not a medical assessment. You decide
          what to share with each service.
        </p>
        <AccessibleFormField
          id="visibility-default"
          label="Default visibility"
          hint="Changes apply only after you save sharing."
        >
          <select
            id="visibility-default"
            className={formInputClass}
            value={visibility}
            disabled={loading}
            onChange={(e) =>
              setVisibility(e.target.value as PassportVisibilityDefault)
            }
          >
            {(Object.keys(VISIBILITY_LABELS) as PassportVisibilityDefault[]).map(
              (key) => (
                <option key={key} value={key}>
                  {VISIBILITY_LABELS[key]}
                </option>
              ),
            )}
          </select>
        </AccessibleFormField>
        <Button
          type="button"
          onClick={() =>
            void save(requirements, visibility, "Sharing saved. You control what is shared.")
          }
          disabled={loading}
          className="min-h-11"
        >
          Save sharing
        </Button>
      </section>

      {requirements.length === 0 ? (
        <section
          aria-labelledby="my-access-first-run-heading"
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <h2
            id="my-access-first-run-heading"
            className="font-heading text-lg font-semibold"
          >
            Start with 3 common needs
          </h2>
          <p className="text-sm text-muted-foreground">
            Add a few functional needs to get personalised place results. You can
            change or remove them anytime.
          </p>
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {firstRunConcepts.map((concept) => (
              <li key={concept.ontologyConceptId}>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full sm:w-auto"
                  disabled={loading}
                  onClick={() =>
                    addRequirementFromConcept(concept.ontologyConceptId, "required")
                  }
                >
                  Add {concept.label}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        aria-labelledby="my-access-add-heading"
        className="space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <h2 id="my-access-add-heading" className="font-heading text-lg font-semibold">
          Add an access need
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <AccessibleFormField
            id="add-concept"
            label="Access need"
            error={addError || undefined}
          >
            <select
              id="add-concept"
              className={formInputClass}
              value={addConceptId}
              disabled={loading}
              onChange={(e) => {
                setAddConceptId(e.target.value);
                setAddError("");
              }}
            >
              {COMMON_ACCESS_CONCEPTS.map((c) => (
                <option key={c.ontologyConceptId} value={c.ontologyConceptId}>
                  {c.label}
                </option>
              ))}
            </select>
          </AccessibleFormField>
          <AccessibleFormField id="add-criticality" label="Importance">
            <select
              id="add-criticality"
              className={formInputClass}
              value={addCriticality}
              disabled={loading}
              onChange={(e) =>
                setAddCriticality(e.target.value as typeof addCriticality)
              }
            >
              {ACCESS_CRITICALITIES.map((c) => (
                <option key={c} value={c}>
                  {CRITICALITY_LABELS[c]}
                </option>
              ))}
            </select>
          </AccessibleFormField>
        </div>
        <Button
          type="button"
          onClick={addRequirement}
          disabled={loading}
          className="min-h-11"
        >
          Add to My Access
        </Button>
      </section>

      {UI_SECTIONS.map((section) => {
        const items = section.domains.flatMap((d) => byDomain.get(d) ?? []);
        return (
          <section
            key={section.title}
            aria-labelledby={`section-${section.title}`}
            className="space-y-3"
          >
            <h2
              id={`section-${section.title}`}
              className="font-heading text-lg font-semibold"
            >
              {section.title}
            </h2>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No needs set in this area.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((req) => (
                  <li
                    key={req.id}
                    className="space-y-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {labelForConceptId(req.ontologyConceptId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ACCESS_DOMAIN_LABELS[req.domain]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {req.ontologyConceptId}
                        </p>
                      </div>
                      {confirmRemoveId === req.id ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="min-h-11"
                            disabled={loading}
                            onClick={() => void removeRequirement(req.id)}
                          >
                            Confirm remove
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-11"
                            disabled={loading}
                            onClick={() => setConfirmRemoveId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-11"
                          onClick={() => setConfirmRemoveId(req.id)}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AccessibleFormField
                        id={`${req.id}-criticality`}
                        label="Importance"
                      >
                        <select
                          id={`${req.id}-criticality`}
                          className={formInputClass}
                          value={req.criticality}
                          disabled={loading}
                          onChange={(e) =>
                            updateLocal(req.id, {
                              criticality: e.target
                                .value as MyAccessRequirement["criticality"],
                            })
                          }
                        >
                          {ACCESS_CRITICALITIES.map((c) => (
                            <option key={c} value={c}>
                              {CRITICALITY_LABELS[c]}
                            </option>
                          ))}
                        </select>
                      </AccessibleFormField>
                      <AccessibleFormField
                        id={`${req.id}-disclosure`}
                        label="Share with"
                      >
                        <select
                          id={`${req.id}-disclosure`}
                          className={formInputClass}
                          value={req.disclosureScopes[0] ?? "private"}
                          disabled={loading}
                          onChange={(e) =>
                            updateLocal(req.id, {
                              disclosureScopes: [e.target.value],
                            })
                          }
                        >
                          {ACCESS_DISCLOSURE_SCOPES.map((s) => (
                            <option key={s} value={s}>
                              {DISCLOSURE_SCOPE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </AccessibleFormField>
                      {typeof req.value === "number" ? (
                        <AccessibleFormField id={`${req.id}-value`} label="Value">
                          <input
                            id={`${req.id}-value`}
                            type="number"
                            className={formInputClass}
                            value={req.value}
                            disabled={loading}
                            onChange={(e) =>
                              updateLocal(req.id, {
                                value: Number(e.target.value),
                              })
                            }
                          />
                        </AccessibleFormField>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-11"
                      onClick={() => void save(requirements)}
                      disabled={loading}
                    >
                      Save changes
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
