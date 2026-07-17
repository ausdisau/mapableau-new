export type PlaceholderClassification =
  | "sandbox-only"
  | "disabled"
  | "interface-stable"
  | "removed";

export interface ClassifiedPlaceholder {
  id: string;
  label: string;
  classification: PlaceholderClassification;
  evidence: readonly string[];
  releaseNote: string;
}

export const CLASSIFIED_PLACEHOLDERS: readonly ClassifiedPlaceholder[] = [
  {
    id: "ndia-provider-adapter-stub",
    label: "NDIA provider adapter stub",
    classification: "sandbox-only",
    evidence: [
      "lib/ndis/claiming/adapters/NdiaApiAdapter.stub.ts",
      ".env.example NDIA_PROVIDER_ADAPTER_MODE=mock",
    ],
    releaseNote:
      "NDIA submission remains mock/sandbox only; real submission requires certified integration profiles and human approval.",
  },
  {
    id: "demo-access-routes",
    label: "Demo access routes",
    classification: "sandbox-only",
    evidence: [
      "lib/demo/local-access-pages.ts",
      "app/dev/payout-demo/page.tsx",
    ],
    releaseNote:
      "Demo routes and fixtures are retained for synthetic preview only and must not be treated as production data.",
  },
  {
    id: "partner-webhook-scaffolding",
    label: "Partner webhook scaffolding",
    classification: "interface-stable",
    evidence: [
      "docs/accessops/webhooks.md",
      ".env.example ACCESSOPS_WEBHOOKS_PRODUCTION_ENABLED=false",
    ],
    releaseNote:
      "Webhook DTO/signature contracts are stable, while production delivery remains gated by explicit flags.",
  },
  {
    id: "status-subscriptions-disabled",
    label: "AccessOps status subscriptions disabled",
    classification: "disabled",
    evidence: [".env.example ACCESSOPS_STATUS_SUBSCRIPTIONS_ENABLED=false"],
    releaseNote:
      "Status subscriptions are present as a disabled capability and require operational approval before activation.",
  },
  {
    id: "outdoor-routing-disabled",
    label: "Outdoor routing disabled",
    classification: "disabled",
    evidence: [".env.example ACCESSOPS_OUTDOOR_PROVIDERS_ENABLED=false"],
    releaseNote:
      "Outdoor routing providers are disabled; route outputs remain advisory and uncertain.",
  },
  {
    id: "accessops-feeds-off",
    label: "AccessOps external feeds off",
    classification: "disabled",
    evidence: [".env.example ACCESSOPS_EXTERNAL_FEEDS_ENABLED=false"],
    releaseNote:
      "External AccessOps feeds are disabled by default and cannot be assumed fresh or complete.",
  },
] as const;

export function classifyPlaceholder(id: string): ClassifiedPlaceholder | null {
  return (
    CLASSIFIED_PLACEHOLDERS.find((placeholder) => placeholder.id === id) ?? null
  );
}

export function placeholdersByClassification(
  classification: PlaceholderClassification,
): ClassifiedPlaceholder[] {
  return CLASSIFIED_PLACEHOLDERS.filter(
    (placeholder) => placeholder.classification === classification,
  );
}
