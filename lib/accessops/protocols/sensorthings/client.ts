import { validateSensorThingsQuery } from "./validator";

export function buildSensorThingsUrl(baseUrl: string, query: string): URL {
  const url = new URL(baseUrl);
  const result = validateSensorThingsQuery(query);
  if (!result.conformant) throw new Error(result.errors.join(","));
  url.search = query.startsWith("?") ? query : `?${query}`;
  return url;
}
