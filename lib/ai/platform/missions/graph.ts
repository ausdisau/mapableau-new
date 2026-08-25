import type { MapAbleModule } from "@/intelligence/types";

import type { MissionGraph, MissionGraphNode } from "./types";

function node(
  partial: Omit<
    MissionGraphNode,
    "evidenceRefs" | "confidence" | "limitations"
  > & {
    evidenceRefs?: string[];
    confidence?: number | null;
    limitations?: string[];
  },
): MissionGraphNode {
  return {
    evidenceRefs: partial.evidenceRefs ?? [],
    confidence: partial.confidence ?? null,
    limitations: partial.limitations ?? [],
    ...partial,
  };
}

export function buildMissionGraph(input: {
  objective: string;
  domains: MapAbleModule[];
  profileUsed: boolean;
  profileConsentRequested: boolean;
  profileConsentGranted: boolean;
}): MissionGraph {
  const lower = input.objective.toLowerCase();
  const hasInterviewCue = /\binterview\b|\bemployer\b|\bworkplace\b/.test(lower);
  const hasTransportCue =
    /\btransport\b|\btravel\b|\bwheelchair[\s-]?accessible\b|\bget(?:ting)?\s+there\b/.test(
      lower,
    );
  const hasSupportCue =
    /\bsupport\b|\bhelp\s+getting\s+ready\b|\bcare\b/.test(lower);
  const domains = new Set(input.domains);

  const nodes: MissionGraphNode[] = [
    node({
      id: "node-goal",
      type: "goal",
      label: "Participant goal",
      status: "confirmed",
      sourceDomain: "core",
      recordId: null,
      details: input.objective.slice(0, 500),
    }),
  ];
  const edges: MissionGraph["edges"] = [];

  if (hasInterviewCue || domains.has("jobs")) {
    nodes.push(
      node({
        id: "node-job-interview",
        type: "job",
        label: "Job interview / work event",
        status: hasInterviewCue ? "needs_review" : "missing",
        sourceDomain: "jobs",
        recordId: null,
        details: "Timing and location need participant confirmation.",
        limitations: ["No calendar record linked in this planning pass"],
      }),
      node({
        id: "node-workplace-access",
        type: "accessibility",
        label: "Workplace accessibility evidence",
        status: "missing",
        sourceDomain: "access",
        recordId: null,
        details: "No verified workplace accessibility audit on file.",
      }),
    );
    edges.push(
      {
        id: "edge-goal-job",
        fromId: "node-goal",
        toId: "node-job-interview",
        label: "Supports goal",
        dependencyKind: "informs",
      },
      {
        id: "edge-job-access",
        fromId: "node-job-interview",
        toId: "node-workplace-access",
        label: "Requires workplace access evidence",
        dependencyKind: "requires",
      },
    );
  }

  if (hasTransportCue || domains.has("transport")) {
    nodes.push(
      node({
        id: "node-transport",
        type: "transport",
        label: "Accessible transport readiness",
        status: "missing",
        sourceDomain: "transport",
        recordId: null,
        details: "No confirmed accessible journey exists yet.",
      }),
    );
    edges.push({
      id: "edge-goal-transport",
      fromId: "node-goal",
      toId: "node-transport",
      label: "May require transport",
      dependencyKind: "informs",
    });
    if (nodes.some((n) => n.id === "node-job-interview")) {
      edges.push({
        id: "edge-job-transport",
        fromId: "node-job-interview",
        toId: "node-transport",
        label: "Interview travel dependency",
        dependencyKind: "requires",
      });
    }
  }

  if (hasSupportCue || domains.has("care")) {
    nodes.push(
      node({
        id: "node-care-support",
        type: "care_support",
        label: "Support for preparation / attendance",
        status: "missing",
        sourceDomain: "care",
        recordId: null,
        details: "No confirmed support worker assignment.",
      }),
    );
    edges.push({
      id: "edge-goal-care",
      fromId: "node-goal",
      toId: "node-care-support",
      label: "May require support",
      dependencyKind: "informs",
    });
  }

  if (input.profileUsed) {
    nodes.push(
      node({
        id: "node-profile",
        type: "evidence",
        label: "Accessibility profile (consented)",
        status: "available",
        sourceDomain: "core",
        recordId: null,
        details:
          "Functional requirements referenced by consent — not diagnosis.",
      }),
    );
  } else if (
    input.profileConsentRequested &&
    !input.profileConsentGranted
  ) {
    nodes.push(
      node({
        id: "node-profile",
        type: "evidence",
        label: "Accessibility profile",
        status: "consent_required",
        sourceDomain: "core",
        recordId: null,
        details: "Profile use was requested but consent was not granted.",
      }),
    );
  }

  return { nodes, edges };
}
