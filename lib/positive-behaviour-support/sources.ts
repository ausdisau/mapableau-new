/**
 * Regulatory sources for PBS — register through ProgrammeSourceRecord only.
 * Compute sourceHash only when the actual document bytes were retrieved.
 */

export interface PbsSourceDescriptor {
  title: string;
  url: string;
  retrievedDate: string;
  applicableVersion: string;
  reviewDate: string;
  sourceHash: string | null;
  retrievalStatus: "retrieved" | "pending_binary_retrieval" | "page_retrieved_hash_pending";
  affectedProgramme: "positive_behaviour_support";
  sourceType: "legislation" | "regulation" | "government_guidance";
}

export const PBS_SOURCE_DESCRIPTORS: PbsSourceDescriptor[] = [
  {
    title:
      "NDIS Commission position statement: Use of artificial intelligence in the development of behaviour support plans",
    url: "https://www.ndiscommission.gov.au/sites/default/files/2026-02/Position%20statement%20-%20Use%20of%20artificial%20intelligence%20in%20development%20of%20behaviour%20support%20plans.pdf",
    retrievedDate: "2026-07-20",
    applicableVersion: "February 2026",
    reviewDate: "2027-02-01",
    sourceHash: null,
    retrievalStatus: "pending_binary_retrieval",
    affectedProgramme: "positive_behaviour_support",
    sourceType: "government_guidance",
  },
  {
    title: "National Disability Insurance Scheme (Restrictive Practices and Behaviour Support) Rules 2018",
    url: "https://www.legislation.gov.au/F2018L00632/latest",
    retrievedDate: "2026-07-20",
    applicableVersion: "F2018L00632 (latest as retrieved)",
    reviewDate: "2027-01-01",
    sourceHash: null,
    retrievalStatus: "pending_binary_retrieval",
    affectedProgramme: "positive_behaviour_support",
    sourceType: "legislation",
  },
  {
    title:
      "Rules for Specialist behaviour support providers and NDIS behaviour support practitioners",
    url: "https://www.ndiscommission.gov.au/rules-and-standards/behaviour-support-and-restrictive-practices/rules-for-specialist-behaviour-support-providers-NDIS-behaviour-support-practitioners",
    retrievedDate: "2026-07-20",
    applicableVersion: "Commission HTML guidance (retrieved 2026-07-20)",
    reviewDate: "2027-01-01",
    sourceHash: null,
    retrievalStatus: "page_retrieved_hash_pending",
    affectedProgramme: "positive_behaviour_support",
    sourceType: "government_guidance",
  },
  {
    title: "How to develop behaviour support plans",
    url: "https://www.ndiscommission.gov.au/rules-and-standards/behaviour-support-and-restrictive-practices/how-develop-behaviour-support-plans",
    retrievedDate: "2026-07-20",
    applicableVersion: "Commission HTML guidance (retrieved 2026-07-20)",
    reviewDate: "2027-01-01",
    sourceHash: null,
    retrievalStatus: "page_retrieved_hash_pending",
    affectedProgramme: "positive_behaviour_support",
    sourceType: "government_guidance",
  },
  {
    title: "Behaviour Support Assessment and FBA Practice Guide",
    url: "https://www.ndiscommission.gov.au/sites/default/files/2026-05/Behaviour-Support-Assessment-FBA-Guide-PDF.pdf",
    retrievedDate: "2026-07-20",
    applicableVersion: "May 2026",
    reviewDate: "2027-05-01",
    sourceHash: null,
    retrievalStatus: "pending_binary_retrieval",
    affectedProgramme: "positive_behaviour_support",
    sourceType: "government_guidance",
  },
  {
    title: "Policy Guidance — Monitoring and Reviewing Behaviour Support Plans",
    url: "https://www.ndiscommission.gov.au/sites/default/files/2026-05/Policy%20Guidance%20-%20Monitoring%20and%20Reviewing%20Behaviour%20Support%20Plans%20-%20May%202026.PDF",
    retrievedDate: "2026-07-20",
    applicableVersion: "May 2026",
    reviewDate: "2027-05-01",
    sourceHash: null,
    retrievalStatus: "pending_binary_retrieval",
    affectedProgramme: "positive_behaviour_support",
    sourceType: "government_guidance",
  },
];

export function pbsSourcesReadyForHashSeed(): PbsSourceDescriptor[] {
  return PBS_SOURCE_DESCRIPTORS.filter((s) => s.sourceHash != null);
}
