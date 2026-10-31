/**
 * Pure, portable Marketplace evidence-preview domain.
 * Data is synthetic. No inventory, seller identity, funding, price or clinical safety
 * assertion in this file is a real-world claim or a checkout authority.
 */
export type Category = "daily-living" | "communication" | "sensory" | "assistive-technology";
export type Condition = "new" | "refurbished" | "used";
export type SourceStatus = "seller_stated" | "document_checked" | "independently_checked" | "unknown";
export type SafetyGate = "lower_risk_demo" | "specialist_review" | "restricted";

export interface EvidenceField {
  readonly name: string;
  readonly detail: string;
  readonly source: SourceStatus;
  readonly reviewedAt?: string;
}

export interface EvidenceListing {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly condition: Condition;
  readonly description: string;
  readonly sellerLabel: string;
  readonly indicativePriceCents: number | null;
  readonly priceStatus: "illustrative" | "quote_required";
  readonly availability: "unconfirmed";
  readonly fundingAssessment: "not_assessed";
  readonly safetyGate: SafetyGate;
  readonly features: readonly string[];
  readonly conditionNote: string;
  readonly deliveryNote: string;
  readonly evidence: readonly EvidenceField[];
}

export interface LocalDraftLine {
  readonly listingId: string;
  readonly quantity: number;
}

export const CATEGORY_LABELS: Readonly<Record<Category, string>> = {
  "daily-living": "Daily living",
  communication: "Communication",
  sensory: "Sensory comfort",
  "assistive-technology": "Accessible technology",
};

export const CONDITION_LABELS: Readonly<Record<Condition, string>> = {
  new: "New (example)",
  refurbished: "Refurbished (example)",
  used: "Pre-owned (example)",
};

export const EVIDENCE_LABELS: Readonly<Record<SourceStatus, string>> = {
  seller_stated: "Seller statement — not verified",
  document_checked: "Document reviewed",
  independently_checked: "Independently checked",
  unknown: "Unknown — not confirmed",
};

export const SAFETY_LABELS: Readonly<Record<SafetyGate, string>> = {
  lower_risk_demo: "Lower-risk demonstration category; suitability unassessed",
  specialist_review: "Specialist review required before any sale",
  restricted: "Not available for enquiry",
};

function stated(name: string, detail: string): EvidenceField {
  return { name, detail, source: "seller_stated" };
}
function unknown(name: string): EvidenceField {
  return { name, detail: "Information not supplied", source: "unknown" };
}

/** Demonstration fixtures only: no real sellers, stock, prices, or inspections. */
export const EVIDENCE_DEMO_LISTINGS: readonly EvidenceListing[] = [
  {
    id: "example-keyboard",
    name: "Large-key accessible keyboard",
    category: "assistive-technology",
    condition: "new",
    description: "Example high-contrast keyboard with large keys for everyday computer use.",
    sellerLabel: "Synthetic supplier A",
    indicativePriceCents: 16900,
    priceStatus: "illustrative",
    availability: "unconfirmed",
    fundingAssessment: "not_assessed",
    safetyGate: "lower_risk_demo",
    features: ["Large keys", "High-contrast labels", "Computer access"],
    conditionNote: "Illustrative new product; no stock or product condition inspected.",
    deliveryNote: "Delivery, warranty and total price not confirmed.",
    evidence: [
      stated("Access features", "Large, high-contrast keys — sample description"),
      unknown("Overall dimensions"),
      unknown("Warranty"),
    ],
  },
  {
    id: "example-reacher",
    name: "Easy-grip reacher",
    category: "daily-living",
    condition: "refurbished",
    description: "Example reach extender with soft-grip trigger for everyday items.",
    sellerLabel: "Synthetic supplier B",
    indicativePriceCents: 2900,
    priceStatus: "illustrative",
    availability: "unconfirmed",
    fundingAssessment: "not_assessed",
    safetyGate: "lower_risk_demo",
    features: ["Daily living", "Grip", "Reuse"],
    conditionNote: "Refurbishment and cleaning are not inspected or validated.",
    deliveryNote: "Delivery costs are unknown.",
    evidence: [stated("Condition", "Refurbished — sample seller claim"), unknown("Length"), unknown("Cleaning process")],
  },
  {
    id: "example-communication-board",
    name: "Portable communication board",
    category: "communication",
    condition: "new",
    description: "Example low-tech AAC board for common phrases and choices.",
    sellerLabel: "Synthetic supplier C",
    indicativePriceCents: 4500,
    priceStatus: "illustrative",
    availability: "unconfirmed",
    fundingAssessment: "not_assessed",
    safetyGate: "lower_risk_demo",
    features: ["AAC", "Portable", "Low-tech"],
    conditionNote: "No real product or stock is offered.",
    deliveryNote: "Delivery and pickup options are unknown.",
    evidence: [stated("Communication", "Example core-vocabulary grid"), unknown("Language options"), unknown("Materials")],
  },
  {
    id: "example-lamp",
    name: "Adjustable soft-light lamp",
    category: "sensory",
    condition: "used",
    description: "Illustrative pre-owned desk lamp with adjustable brightness.",
    sellerLabel: "Synthetic supplier D",
    indicativePriceCents: 3900,
    priceStatus: "illustrative",
    availability: "unconfirmed",
    fundingAssessment: "not_assessed",
    safetyGate: "specialist_review",
    features: ["Low glare", "Lighting", "Pre-owned"],
    conditionNote: "Electrical testing and cable condition are unknown. Not eligible for a draft enquiry.",
    deliveryNote: "Delivery and handling are unknown.",
    evidence: [stated("Controls", "Example brightness controls"), unknown("Electrical inspection"), unknown("Cable condition")],
  },
  {
    id: "example-switch-mount",
    name: "Tablet and access-switch mount",
    category: "assistive-technology",
    condition: "refurbished",
    description: "Illustrative tablet positioning and switch-access hardware.",
    sellerLabel: "Synthetic supplier E",
    indicativePriceCents: 12000,
    priceStatus: "illustrative",
    availability: "unconfirmed",
    fundingAssessment: "not_assessed",
    safetyGate: "specialist_review",
    features: ["AAC", "Mounting", "Compatibility"],
    conditionNote: "Load rating, fitting and compatibility require specialist assessment.",
    deliveryNote: "Installation and delivery not quoted.",
    evidence: [stated("Compatibility", "Generic mounts claimed by sample seller"), unknown("Load rating"), unknown("Fixing instructions")],
  },
  {
    id: "example-timer",
    name: "Large-display kitchen timer",
    category: "daily-living",
    condition: "new",
    description: "Example timer with large numbers and audible notification.",
    sellerLabel: "Synthetic supplier F",
    indicativePriceCents: 3200,
    priceStatus: "illustrative",
    availability: "unconfirmed",
    fundingAssessment: "not_assessed",
    safetyGate: "lower_risk_demo",
    features: ["Large display", "Kitchen", "Everyday"],
    conditionNote: "Illustrative example only; availability not verified.",
    deliveryNote: "Delivery, returns and warranty not confirmed.",
    evidence: [stated("Display", "Large digits — sample seller statement"), unknown("Control force"), unknown("Warranty")],
  },
];

/** Deterministic search; sponsored payments and protected characteristics play no part. */
export function searchEvidenceListings(input: {
  readonly query?: string;
  readonly category?: Category | "all";
  readonly condition?: Condition | "all";
  readonly lowerRiskOnly?: boolean;
}): EvidenceListing[] {
  const query = (input.query ?? "").trim().toLocaleLowerCase("en-AU");
  return EVIDENCE_DEMO_LISTINGS.filter((listing) => {
    if (listing.safetyGate === "restricted") return false;
    if (input.lowerRiskOnly && listing.safetyGate !== "lower_risk_demo") return false;
    if (input.category && input.category !== "all" && input.category !== listing.category) return false;
    if (input.condition && input.condition !== "all" && input.condition !== listing.condition) return false;
    const corpus = [listing.name, listing.description, ...listing.features].join(" ").toLocaleLowerCase("en-AU");
    return !query || corpus.includes(query);
  }).sort((a, b) => a.name.localeCompare(b.name, "en-AU"));
}

export function findEvidence(listing: EvidenceListing, name: string): EvidenceField {
  return listing.evidence.find((item) => item.name.toLowerCase() === name.toLowerCase()) ?? unknown(name);
}

/** Specialist-review examples remain visible for learning, but cannot enter the local draft. */
export function canAddToLocalDraft(listing: EvidenceListing): boolean {
  return listing.safetyGate === "lower_risk_demo";
}

export function formatIndicativePrice(cents: number | null): string {
  return cents === null
    ? "Quote needed"
    : new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

/** The only "enquiry" created by this prototype is local text downloaded by the user. */
export function makeLocalEnquiryDraft(lines: readonly LocalDraftLine[]): string {
  if (lines.length === 0) return "No items selected for a local draft.";
  const ids = new Set<string>();
  const text: string[] = [
    "MAPABLE MARKETPLACE — SYNTHETIC, LOCAL-ONLY ENQUIRY DRAFT",
    "NOT SENT. NO SUPPLIER CONTACTED. NO ORDER, INVOICE OR PAYMENT CREATED.",
    "The supplier names and prices below are illustrative, not real offers.",
    "",
  ];
  for (const line of lines) {
    const listing = EVIDENCE_DEMO_LISTINGS.find((item) => item.id === line.listingId);
    if (!listing || !canAddToLocalDraft(listing) ||
        !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 5 ||
        ids.has(line.listingId)) {
      return "Invalid draft selection. No document was created.";
    }
    ids.add(line.listingId);
    text.push(
      String(line.quantity) + " × " + listing.name +
      " | illustrative price " + formatIndicativePrice(listing.indicativePriceCents) +
      " | " + listing.sellerLabel,
    );
  }
  text.push("");
  text.push("Please check actual condition, availability, ownership, warranty, GST, shipping, recalls and suitability independently.");
  text.push("No NDIS funding, clinical suitability or safety assessment is implied.");
  return text.join("\n");
}
