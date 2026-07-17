import type { MergeTrainSeed } from "@/lib/convergence-os/types";

/**
 * MapAble Productisation and Connected Service Programme — advisory merge train.
 * Humans execute in GitHub. ConvergenceOS never auto-merges.
 */
export const PRODUCTISATION_MERGE_TRAIN: MergeTrainSeed = {
  trainKey: "productisation_connected_service_v1",
  name: "PRODUCTISATION + CONNECTED SERVICE",
  trainType: "PRODUCTISATION",
  summary:
    "Wave 0 reconciliation → close superseded → merge #310/#273/#308 → security hardening → Communication–Workforce slice → Companion → Provider Ops → Care/Transport/Billing loops → controlled pilot.",
  riskSummary:
    "Critical: dual SoTs (TransportBooking/Trip, Invoice/BillingInvoice, Continuity forks, AI Next vs Expansion); mega-stack #296–#299; CareOS off-main; AI authority creep. No automated merge.",
  rollbackNotes:
    "Revert merge commits in reverse train order; keep product flags off; no participant-data backfill assumed for registry-only Wave 0.",
  steps: [
    {
      stepOrder: 0,
      action: "close_superseded",
      prNumber: 289,
      evidence: "Close #289/#290 — superseded by merged #302",
      humanOwner: "architecture_reviewer",
      rollback: "N/A — close only",
    },
    {
      stepOrder: 1,
      action: "close_superseded",
      prNumber: 291,
      evidence: "Close #291 — superseded by #308 VisionAccess bridge",
      humanOwner: "architecture_reviewer",
      rollback: "N/A",
    },
    {
      stepOrder: 2,
      action: "close_superseded",
      prNumber: 264,
      evidence: "Close #264 — superseded by #273 + AI Next on main",
      humanOwner: "architecture_reviewer",
      rollback: "N/A",
    },
    {
      stepOrder: 3,
      action: "close_superseded",
      prNumber: 287,
      evidence: "Close #287/#288 — Continuity predecessors; consolidate via #301",
      humanOwner: "architecture_reviewer",
      rollback: "N/A",
    },
    {
      stepOrder: 4,
      action: "merge_docs_registries",
      branchName: "cursor/canonical-repo-reconciliation-6ea8",
      evidence:
        "Productisation Wave 0: PR action ledger, public-claim registry, capability honesty, merge train — no product schema",
      humanOwner: "release_manager",
      rollback: "Revert Wave 0 PR",
    },
    {
      stepOrder: 5,
      action: "rebase_then_merge",
      prNumber: 310,
      evidence: "Connected Capability foundation — early train after Wave 0 registries",
      humanOwner: "architecture_reviewer",
      rollback: "Revert #310",
    },
    {
      stepOrder: 6,
      action: "security_hardening_pr",
      branchName: "cursor/api-tenant-hardening-6ea8",
      evidence:
        "Dedicated encryption key, Zod high-risk routes, server org scope, IDOR tests — before NDIS/AI product merges where possible",
      humanOwner: "security_reviewer",
      rollback: "Revert hardening PR; fail-closed keys",
    },
    {
      stepOrder: 7,
      action: "rebase_then_merge",
      prNumber: 286,
      evidence: "NDIS Gateway domain only; adapters and real NDIA submission remain disabled",
      humanOwner: "database_reviewer",
      rollback: "Revert #286 lib",
    },
    {
      stepOrder: 8,
      action: "merge",
      prNumber: 273,
      evidence: "AI Expansion after reconciliation; then namespace consolidate with AI Next",
      humanOwner: "architecture_reviewer",
      rollback: "Revert #273; flags stay off",
    },
    {
      stepOrder: 9,
      action: "merge",
      prNumber: 308,
      evidence: "Living Access Fabric + VisionAccess bridge; supersedes #291",
      humanOwner: "architecture_reviewer",
      rollback: "Revert #308",
    },
    {
      stepOrder: 10,
      action: "rebase_then_merge",
      prNumber: 307,
      evidence: "Accountability portal foundation for Wave 18",
      humanOwner: "governance_reviewer",
      rollback: "Revert #307",
    },
    {
      stepOrder: 11,
      action: "split_consolidate",
      prNumber: 296,
      evidence: "Split #296→#298→#299; consolidate #301 Continuity; #309 AccessOps — no mega-stack",
      humanOwner: "architecture_reviewer",
      rollback: "Leave unmerged until split PRs ready",
    },
    {
      stepOrder: 12,
      action: "vertical_slice",
      branchName: "cursor/comm-workforce-slice-6ea8",
      evidence: "Communication Passport → worker acknowledgement → readiness reasons; no auto-assign",
      humanOwner: "product_reviewer",
      rollback: "Feature flag off",
    },
    {
      stepOrder: 13,
      action: "companion_foundation",
      branchName: "cursor/native-companion-foundation-6ea8",
      evidence: "Expo + encrypted Visit Pack; no WebView; no compulsory smartphone",
      humanOwner: "mobile_reviewer",
      rollback: "Unpublish builds; flag off",
    },
    {
      stepOrder: 14,
      action: "provider_ops_projection",
      branchName: "cursor/provider-ops-projection-6ea8",
      evidence: "Read-only attention queue; deep links to canonical writers only",
      humanOwner: "ops_reviewer",
      rollback: "Flag off",
    },
    {
      stepOrder: 15,
      action: "retire_after_migration",
      prNumber: 283,
      evidence: "TransportBooking writers → TransportTrip; legacy Invoice → BillingInvoice",
      humanOwner: "database_reviewer",
      rollback: "Dual-read window then disable writers",
    },
    {
      stepOrder: 16,
      action: "controlled_pilot",
      evidence:
        "Starting Work / Taylor @ Harbour Civic Centre — human review throughout; no live NDIA; no AI decisions",
      humanOwner: "pilot_lead",
      rollback: "Suspend pilot flags; Continuity recovery",
    },
    {
      stepOrder: 17,
      action: "rescan_convergence",
      evidence:
        "After each human merge: rebase dependents; rerun remediation CI; refresh PR action ledger",
      humanOwner: "release_manager",
      rollback: "Disable MAPABLE_CONVERGENCE_OS_ENABLED",
    },
  ],
};
