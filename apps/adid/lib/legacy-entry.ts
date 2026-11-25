import { serviceFor } from "./service-directory.ts";

export function clerkEntryDestination(requestUrl: string) {
  const incoming = new URL(requestUrl);
  const destination = new URL(
    incoming.searchParams.get("screen_hint") === "signup"
      ? "/sign-up"
      : "/sign-in",
    incoming.origin,
  );
  const service = serviceFor(incoming.searchParams.get("service"));
  if (service) destination.searchParams.set("service", service.id);
  return destination;
}
