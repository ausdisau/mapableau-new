export function validateOgcFeaturesQuery(params: URLSearchParams): {
  allowed: boolean;
  reason: string;
} {
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase().includes("participant"))
      return { allowed: false, reason: "participant_data_not_allowed" };
    if (/[;$]|--|\/\*/.test(value))
      return { allowed: false, reason: "query_injection_pattern" };
  }
  return { allowed: true, reason: "read_only_query" };
}
