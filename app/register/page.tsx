import Link from "next/link";
import { Suspense } from "react";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Button } from "@/components/ui/button";
import { clerkLoginSelected, getAdidConfig } from "@/lib/auth/adid-config";
import { getConfiguredOAuthProviders } from "@/lib/auth/oauth-providers";

import RegisterClient from "./RegisterClient";
import { startClerkRegistration } from "./start-clerk-registration";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ inviteToken?: string; callbackUrl?: string }>;
}) {
  if (clerkLoginSelected()) {
    const params = await searchParams;
    return (
      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-12">
        <CorePageHeader
          eyebrow="MapAble"
          title="Create your AD.iD account"
          description="Choose the region where you use MapAble. Clerk will open so you can register your account."
        />
        {getAdidConfig() ? (
          <form action={startClerkRegistration} className="flex flex-col gap-4">
            <input
              type="hidden"
              name="inviteToken"
              value={
                typeof params.inviteToken === "string" ? params.inviteToken : ""
              }
            />
            <input
              type="hidden"
              name="callbackUrl"
              value={
                typeof params.callbackUrl === "string" ? params.callbackUrl : ""
              }
            />
            <label htmlFor="adid-region">Country or region</label>
            <select
              name="jurisdiction"
              id="adid-region"
              className="min-h-11 rounded border px-3"
              defaultValue="AU"
            >
              <option value="AU">Australia</option>
              <option value="NZ">New Zealand</option>
            </select>
            <Button type="submit">Create an account with AD.iD</Button>
          </form>
        ) : (
          <p role="status">AD.iD registration is temporarily unavailable.</p>
        )}
        <Link className="underline" href="/login">
          Sign in to an existing account
        </Link>
        <a className="underline" href="https://www.ausdis.com.au/contact-3">
          Get help registering
        </a>
      </div>
    );
  }
  const oauthProviders = getConfiguredOAuthProviders();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <CorePageHeader
        eyebrow="MapAble"
        title="Create account"
        description="Set up access to find support, request care, book transport, and manage your dashboard."
        centered
        className="mb-8 border-0 pb-0"
      />
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">
            Loading registration form…
          </p>
        }
      >
        <RegisterClient oauthProviders={oauthProviders} />
      </Suspense>
    </div>
  );
}
