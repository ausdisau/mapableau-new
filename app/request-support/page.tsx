import Link from "next/link";

import { RequestConciergeForm } from "@/components/wedges/concierge/RequestConciergeForm";
import { NDIS_BOUNDARY_NOTICE } from "@/types/wedges";

export const metadata = {
  title: "Request support | MapAble",
  description:
    "Describe what support you need and get a structured provider search request with access-fit requirements.",
};

export default function RequestSupportPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <header>
        <h1 className="font-heading text-3xl font-bold">Request support</h1>
        <p className="mt-2 text-muted-foreground">
          Tell us what you need. We will help structure a provider search with the
          right access, location, and funding filters — without making NDIS or
          clinical decisions for you.
        </p>
      </header>

      <RequestConciergeForm />

      <p className="text-xs text-muted-foreground" role="note">
        {NDIS_BOUNDARY_NOTICE}
      </p>

      <p className="text-sm">
        Prefer to browse?{" "}
        <Link href="/providers/available-now" className="text-primary underline">
          See providers available now
        </Link>{" "}
        or{" "}
        <Link href="/provider-finder" className="text-primary underline">
          open the provider finder
        </Link>
        .
      </p>
    </main>
  );
}
