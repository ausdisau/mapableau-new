export type EvidenceStrength = "low" | "moderate" | "strong";
export type EvidenceClass =
  | "behavioural"
  | "architecture"
  | "experiment"
  | "other";
export type EvidencePublicationStatus =
  | "peer_reviewed"
  | "preprint"
  | "review"
  | "commentary"
  | "other";
export type EvidenceReplicationStatus =
  | "replicated"
  | "partially_replicated"
  | "not_replicated"
  | "unknown";

export type EvidencePolicyInput = {
  publicationStatus: EvidencePublicationStatus;
  replicationStatus: EvidenceReplicationStatus;
  claimedStrength: EvidenceStrength;
  evidenceClass: EvidenceClass;
  isSelfReport: boolean;
};

export type EvidencePolicyDecision = {
  maxStrength: EvidenceStrength;
  normalizedStrength: EvidenceStrength;
  reasons: string[];
};

const strengthRank: Record<EvidenceStrength, number> = {
  low: 0,
  moderate: 1,
  strong: 2,
};

function weakerStrength(
  claimed: EvidenceStrength,
  maximum: EvidenceStrength,
): EvidenceStrength {
  return strengthRank[claimed] <= strengthRank[maximum] ? claimed : maximum;
}

export function classifyEvidence(
  input: EvidencePolicyInput,
): EvidencePolicyDecision {
  const reasons: string[] = [];
  let maxStrength: EvidenceStrength = "strong";

  if (input.isSelfReport) {
    maxStrength = "low";
    reasons.push(
      "AI self-report is treated as weak behavioural evidence and cannot establish privileged internal access or phenomenal consciousness.",
    );
  } else if (input.publicationStatus === "commentary") {
    maxStrength = "low";
    reasons.push(
      "Commentary is interpretive evidence; cited primary sources must be assessed independently.",
    );
  } else if (input.publicationStatus === "preprint") {
    maxStrength = "moderate";
    reasons.push(
      "Preprints may inform frontier research but are capped below strong until peer review and stronger replication evidence are available.",
    );
  } else if (input.publicationStatus === "review") {
    maxStrength = "moderate";
    reasons.push(
      "Reviews synthesize evidence but do not replace independent assessment of the underlying primary studies.",
    );
  } else if (input.publicationStatus === "other") {
    maxStrength = "low";
    reasons.push("Unclassified publication status is capped at low evidence strength.");
  }

  if (!input.isSelfReport && input.publicationStatus === "peer_reviewed") {
    if (input.replicationStatus === "not_replicated") {
      maxStrength = "low";
      reasons.push("A failed replication caps the evidence at low strength.");
    } else if (
      input.replicationStatus === "unknown" ||
      input.replicationStatus === "partially_replicated"
    ) {
      maxStrength = "moderate";
      reasons.push(
        "Peer-reviewed evidence without clear independent replication is capped at moderate strength.",
      );
    } else {
      reasons.push(
        "Replicated peer-reviewed evidence may retain strong strength, subject to method and confound review.",
      );
    }
  }

  if (
    input.evidenceClass === "behavioural" &&
    maxStrength === "strong" &&
    input.replicationStatus !== "replicated"
  ) {
    maxStrength = "moderate";
    reasons.push(
      "Behavioural evidence without replication is capped below strong because mimicry and task inference remain alternative explanations.",
    );
  }

  return {
    maxStrength,
    normalizedStrength: weakerStrength(input.claimedStrength, maxStrength),
    reasons,
  };
}
