export function accreditationEvidenceRequired(
  level: "bronze" | "silver" | "gold",
): string[] {
  return level === "gold"
    ? ["assessment", "photos", "independent_review"]
    : ["assessment", "photos"];
}
