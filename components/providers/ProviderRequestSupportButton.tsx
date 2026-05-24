import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type ProviderRequestSupportButtonProps = {
  providerId: string;
  providerName: string;
  slug: string;
  disabled?: boolean;
};

export function ProviderRequestSupportButton({
  providerId,
  providerName,
  slug,
  disabled = false,
}: ProviderRequestSupportButtonProps) {
  const params = new URLSearchParams({
    providerId,
    providerSlug: slug,
    providerName,
  });

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Ready for the next step?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Request support from this provider. You can review details before anything
        is shared beyond what you choose.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          variant="default"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          asChild
          disabled={disabled}
        >
          <Link
            href={`/dashboard/bookings/new?${params.toString()}`}
            aria-label={`Request support from ${providerName}`}
          >
            Request support from this provider
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="min-h-11 w-full sm:w-auto" asChild>
          <Link href="/provider-finder">Back to search</Link>
        </Button>
      </div>
    </div>
  );
}
