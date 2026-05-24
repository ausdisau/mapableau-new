export type SupportTypeId =
  | "all"
  | "personal-care"
  | "transport"
  | "therapy"
  | "employment"
  | "home-help";

export type SupportType = {
  id: SupportTypeId;
  label: string;
  categories: string[];
};

export const SUPPORT_TYPES: SupportType[] = [
  { id: "all", label: "All", categories: [] },
  {
    id: "personal-care",
    label: "Personal care",
    categories: ["Assistance with Daily Life"],
  },
  { id: "transport", label: "Transport", categories: ["Transport"] },
  {
    id: "therapy",
    label: "Therapy",
    categories: ["Therapeutic Supports"],
  },
  {
    id: "employment",
    label: "Employment",
    categories: ["Employment Supports"],
  },
  {
    id: "home-help",
    label: "Home help",
    categories: ["Assistance with Daily Life", "Home Modifications"],
  },
];

export type AccessNeed = {
  id: string;
  label: string;
  keywords: string[];
};

export const ACCESS_NEEDS: AccessNeed[] = [
  { id: "wheelchair", label: "Wheelchair access", keywords: ["wheelchair", "access"] },
  { id: "auslan", label: "Auslan", keywords: ["auslan", "interpreter"] },
  { id: "low-sensory", label: "Low sensory", keywords: ["sensory", "quiet"] },
  { id: "hoist", label: "Hoist trained", keywords: ["hoist", "transfer"] },
  {
    id: "complex",
    label: "Complex support",
    keywords: ["complex", "high needs", "specialist"],
  },
];

export const FUNDING_OPTIONS = [
  { id: "all", label: "Any funding type" },
  { id: "ndis", label: "NDIS registered" },
  { id: "plan-managed", label: "Plan-managed" },
  { id: "self-managed", label: "Self-managed" },
  { id: "private", label: "Private pay" },
] as const;

export const HERO_SUGGESTED_SEARCHES = [
  "Support worker near St Ives",
  "Wheelchair accessible transport tomorrow",
  "OT assessment with NDIS registration",
  "Low sensory community access support",
  "Employment support with transport",
] as const;
