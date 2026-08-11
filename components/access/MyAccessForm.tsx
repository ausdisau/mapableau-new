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
  type AccessDomain,
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

const COMMON_CONCEPTS: Array<{
  ontologyConceptId: string;
  domain: AccessDomain;
  attribute: string;
  label: string;
  defaultComparator?: "eq" | "gte";
  defaultValue?: string | number | boolean;
  unit?: string;
}> = [
  {
    ontologyConceptId: "mobility_movement.step_free",
    domain: "mobility_movement",
    attribute: "step_free",
    label: "Step-free access",
    defaultValue: true,
  },
  {
    ontologyConceptId: "mobility_movement.minimum_clear_width_mm",
    domain: "mobility_movement",
    attribute: "minimum_clear_width_mm",
    label: "Minimum clear width (mm)",
    defaultComparator: "gte",
    defaultValue: 850,
    unit: "mm",
  },
  {
    ontologyConceptId: "hearing.hearing_augmentation",
    domain: "hearing",
    attribute: "hearing_augmentation",
    label: "Hearing augmentation",
    defaultValue: true,
  },
  {
    ontologyConceptId: "self_care_continence.accessible_toilet",
    domain: "self_care_continence",
    attribute: "accessible_toilet",
    label: "Accessible toilet",
    defaultValue: true,
  },
  {
    ontologyConceptId: "sensory_regulation.quiet_space",
    domain: "sensory_regulation",
    attribute: "quiet_space",
    label: "Quiet space available",
    defaultValue: true,
  },
  {
    ontologyConceptId: "speech_communication.text_fallback",
    domain: "speech_communication",
    attribute: "text_fallback",
    label: "Text communication option",
    defaultValue: true,
  },
  {
    ontologyConceptId: "transport.accessible_vehicle",
    domain: "transport",
    attribute: "accessible_vehicle",
    label: "Accessible vehicle",
    defaultValue: true,
  },
  {
    ontologyConceptId: "emergency.accessible_exit_information",
    domain: "emergency",
    attribute: "accessible_exit_information",
    label: "Accessible exit information",
    defaultValue: true,
  },
];

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
  visibilityDefault: "private" | "request_scoped" | "approved_service";
}) {
  const router = useRouter();
  const [requirements, setRequirements] =
    useState<MyAccessRequirement[]>(initialRequirements);
  const [visibility, setVisibility] = useState(visibilityDefault);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [addConceptId, setAddConceptId] = useState(COMMON_CONCEPTS[0]!.ontologyConceptId);
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

  async function save(next: MyAccessRequirement[], nextVisibility = visibility) {
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
      setStatus("Saved. You control what is shared.");
      router.refresh();
    } catch {
      setError("Could not save My Access. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function addRequirement() {
    const concept = COMMON_CONCEPTS.find((c) => c.ontologyConceptId === addConceptId);
    if (!concept) return;
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
      criticality: addCriticality,
      contextScope: "always",
      timing: "permanent",
      assistance: "independent",
      disclosureScopes: ["private"],
      userConfirmed: true,
    };
    const updated = [...requirements, next];
    setRequirements(updated);
    void save(updated);
  }

  async function removeRequirement(id: string) {
    const target = requirements.find((r) => r.id === id);
    if (!target) return;
    if (id.startsWith("tmp_")) {
      setRequirements((prev) => prev.filter((r) => r.id !== id));
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
    <div className="space-y-8">
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
        <AccessibleFormField id="visibility-default" label="Default visibility">
          <select
            id="visibility-default"
            className={formInputClass}
            value={visibility}
            onChange={(e) => {
              const v = e.target.value as typeof visibility;
              setVisibility(v);
              void save(requirements, v);
            }}
          >
            <option value="private">Private (default)</option>
            <option value="request_scoped">Share per request</option>
            <option value="approved_service">Approved services</option>
          </select>
        </AccessibleFormField>
      </section>

      <section
        aria-labelledby="my-access-add-heading"
        className="space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <h2 id="my-access-add-heading" className="font-heading text-lg font-semibold">
          Add an access need
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <AccessibleFormField id="add-concept" label="Access need">
            <select
              id="add-concept"
              className={formInputClass}
              value={addConceptId}
              onChange={(e) => setAddConceptId(e.target.value)}
            >
              {COMMON_CONCEPTS.map((c) => (
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
              onChange={(e) =>
                setAddCriticality(e.target.value as typeof addCriticality)
              }
            >
              {ACCESS_CRITICALITIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </AccessibleFormField>
        </div>
        <Button type="button" onClick={addRequirement} disabled={loading}>
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
                        <p className="font-medium">{req.ontologyConceptId}</p>
                        <p className="text-xs text-muted-foreground">
                          {ACCESS_DOMAIN_LABELS[req.domain]}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void removeRequirement(req.id)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
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
                          onChange={(e) =>
                            updateLocal(req.id, {
                              criticality: e.target
                                .value as MyAccessRequirement["criticality"],
                            })
                          }
                        >
                          {ACCESS_CRITICALITIES.map((c) => (
                            <option key={c} value={c}>
                              {c.replace(/_/g, " ")}
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
                          onChange={(e) =>
                            updateLocal(req.id, {
                              disclosureScopes: [e.target.value],
                            })
                          }
                        >
                          {ACCESS_DISCLOSURE_SCOPES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
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
