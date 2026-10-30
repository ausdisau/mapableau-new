/**
 * Cookie-authenticated JSON mutations must originate from this app.
 * Browser requests must carry Origin. Mobile bearer-auth requires a separate reviewed adapter.
 */
export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
