import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  HomeShortlistDisabledError,
  listShortlistedProperties,
} from "@/lib/home-living/discovery/shortlist-service";

export const metadata = { title: "Home shortlist | MapAble" };

export default async function HomeShortlistPage() {
  const user = await requireAuth();

  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">My shortlist</h1>
        <p>Home discovery is not enabled in this environment.</p>
      </section>
    );
  }

  let properties: Awaited<ReturnType<typeof listShortlistedProperties>> = [];
  try {
    properties = await listShortlistedProperties(user.id);
  } catch (error) {
    if (!(error instanceof HomeShortlistDisabledError)) throw error;
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">My shortlist</h1>
        <p className="mt-2 max-w-3xl text-slate-700">
          Saved homes for your own comparison. Shortlisting does not contact a
          provider or share your Home and Living profile.
        </p>
      </header>
      {properties.length === 0 ? (
        <p>
          No shortlisted homes yet.{" "}
          <Link href="/home/find" className="underline">
            Find a home
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {properties.map((property) => (
            <li key={property.id} className="rounded border p-4">
              <Link
                href={`/home/properties/${property.id}`}
                className="font-semibold underline"
              >
                {property.title}
              </Link>
              <p className="text-sm text-slate-700">
                {[property.suburb, property.state].filter(Boolean).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link href="/home/compare" className="underline">
          Compare homes
        </Link>
      </p>
    </section>
  );
}
