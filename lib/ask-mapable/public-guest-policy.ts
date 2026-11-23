/** Public-facing routes where a guest may launch the read-only Access Assistant.
 * Deliberately excludes account, participant, billing and admin flows.
 */
const PUBLIC_ROUTES = new Set([
  "/", "/about", "/access", "/accessibility-map", "/provider-finder", "/providers",
  "/care", "/transport", "/employment", "/places", "/contact", "/search",
]);

export function isPublicAccessAssistantRoute(pathname: string): boolean {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  if (PUBLIC_ROUTES.has(path)) return true;
  // Public provider finder location / suburb pages.
  return path.startsWith("/provider-finder/");
}
