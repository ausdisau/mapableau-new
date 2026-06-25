"use client";

import type { AccessDomain } from "@prisma/client";

import {
  DOMAIN_LABELS,
  DOMAIN_QUESTIONS,
} from "@/lib/access-reports/access-domain-config";
import { RATING_CATEGORIES } from "@/lib/access-reviews/access-rating-service";
import { CATEGORY_TO_DOMAIN } from "@/lib/access-reports/access-domain-config";

const VALUES = [
  "not_applicable",
  "unknown",
  "poor",
  "basic",
  "good",
  "excellent",
] as const;

const DOMAINS: AccessDomain[] = [
  "mobility",
  "sensory",
  "communication",
  "cognitive",
  "service",
];

function categoriesForDomain(domain: AccessDomain) {
  return RATING_CATEGORIES.filter(
    (cat) => CATEGORY_TO_DOMAIN[cat] === domain
  );
}

export function AccessReportDomainStep({
  domain,
}: {
  domain: AccessDomain;
}) {
  const categories = categoriesForDomain(domain);

  return (
    <fieldset className="space-y-4">
      <legend className="text-base font-semibold">{DOMAIN_LABELS[domain]}</legend>
      <p className="text-sm text-muted-foreground">{DOMAIN_QUESTIONS[domain]}</p>

      {categories.map((cat) => (
        <fieldset key={cat} className="rounded-lg border border-border p-3">
          <legend className="text-sm font-medium capitalize">
            {cat.replace(/_/g, " ")}
          </legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {VALUES.map((v) => (
              <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`rating-${cat}`}
                  value={v}
                  defaultChecked={v === "unknown"}
                  required
                />
                {v.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </fieldset>
  );
}

export function getAllDomainSteps() {
  return DOMAINS;
}

export function collectRatingsFromForm(fd: FormData) {
  return RATING_CATEGORIES.map((category) => ({
    category,
    value: String(fd.get(`rating-${category}`) ?? "unknown"),
  }));
}
