/**
 * Business Access Resources — practical guidance for venues, providers and employers.
 * Advisory planning resources, not legal/building/medical/NDIS advice.
 */

export type BusinessResourceAudience =
  | "businesses"
  | "venues"
  | "providers"
  | "employers"
  | "event-organisers";

export type BusinessResourceFormat =
  | "self-check"
  | "guide"
  | "checklist"
  | "generator"
  | "playbook"
  | "kit";

export type BusinessBarrierType =
  | "physical"
  | "toilet"
  | "sensory"
  | "communication"
  | "digital"
  | "transport"
  | "attitudinal"
  | "employment"
  | "pricing"
  | "feedback";

export type BusinessResourceStatus = "available" | "draft";

export type BusinessResourceSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BusinessResource = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  audience: BusinessResourceAudience[];
  category: string;
  format: BusinessResourceFormat;
  barrierTypes: BusinessBarrierType[];
  cta: string;
  href: string;
  status: BusinessResourceStatus;
  featured: boolean;
  sections: BusinessResourceSection[];
};

export const BUSINESS_RESOURCES_DISCLAIMER =
  "MapAble resources provide practical access information and improvement guidance. They are not legal, building, safety, medical or NDIS advice. Conditions, obligations and standards can vary by business type, building, service and location. Businesses should seek qualified advice where required.";

export const BUSINESS_RESOURCES_TRUST_NOTE =
  "These resources provide practical access guidance. They do not replace legal, building, safety or professional advice.";
