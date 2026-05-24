export function buildProviderFinderQuery({
  q,
  location,
  support,
}: {
  q?: string;
  location?: string;
  support?: string;
}) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (location?.trim()) params.set("location", location.trim());
  if (support?.trim()) params.set("support", support.trim());
  return params.toString();
}
