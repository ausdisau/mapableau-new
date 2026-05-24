export type IntakeDraft = {
  supportType?: "care" | "transport" | "provider_referral" | "jobs";
  urgency?: string;
  accessNeeds?: string[];
  timing?: string;
  location?: string;
};

export function mapIntakeToRequestPaths(draft: IntakeDraft): string[] {
  const paths: string[] = [];
  if (draft.supportType === "care") paths.push("/dashboard/care/new");
  if (draft.supportType === "transport") paths.push("/dashboard/transport/new");
  if (draft.supportType === "provider_referral") paths.push("/provider-finder");
  if (draft.supportType === "jobs") paths.push("/dashboard/jobs");
  return paths.length ? paths : ["/dashboard/bookings/new"];
}
