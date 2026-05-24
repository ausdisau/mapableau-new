import { Suspense } from "react";

import { CorePageHeader } from "@/components/core/CorePageHeader";

import { LinkAccountClient } from "./LinkAccountClient";

type LinkAccountPageProps = {
  searchParams: Promise<{ token?: string; provider?: string }>;
};

export default async function LinkAccountPage({
  searchParams,
}: LinkAccountPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <CorePageHeader
        title="Link your sign-in"
        description="This email already has a MapAble account. Confirm it is yours before connecting Google or Microsoft."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading…</p>
        }
      >
        <LinkAccountClient
          token={params.token ?? ""}
          providerLabel={params.provider ?? "your provider"}
        />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <a href="/login" className="underline underline-offset-2">
          Back to sign in
        </a>
        {" · "}
        <a
          href="mailto:support@mapable.com.au?subject=Account%20access%20help"
          className="underline underline-offset-2"
        >
          I cannot access my account
        </a>
      </p>
    </div>
  );
}
