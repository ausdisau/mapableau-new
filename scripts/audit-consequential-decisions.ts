#!/usr/bin/env tsx
import { runGovernanceScript, scanFiles } from "./governance/_shared";

void runGovernanceScript({
  name: "audit-consequential-decisions",
  summary:
    "Audit decision notice completeness, evidence-backed reasons and no chain-of-thought publication.",
  checks: [
    "notice_completeness",
    "evidence_backed_reasons",
    "chain_of_thought_excluded",
  ],
  live: async () => ({
    noticeBuilders: scanFiles({
      roots: ["lib/public-interest-governance", "tests"],
      extensions: [".ts"],
      pattern: /noticeIsComplete|buildDecisionNotice|excludesChainOfThought/,
    }),
  }),
});
