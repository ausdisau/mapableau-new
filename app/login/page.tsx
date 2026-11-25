import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { ClerkSignInButton } from "@/components/auth/ClerkSignInButton";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { clerkLoginSelected, getAdidConfig } from "@/lib/auth/adid-config";
import {
  readRegistrationCookie,
  registrationCookie,
} from "@/lib/auth/adid-registration";
import { safeAuthCallbackPath } from "@/lib/auth/auth-flow";
import { getConfiguredOAuthProviders } from "@/lib/auth/oauth-providers";

import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  if (clerkLoginSelected()) {
    const config = getAdidConfig();
    const params = await searchParams;
    const registration = readRegistrationCookie(
      (await cookies()).get(registrationCookie)?.value,
    );
    const callbackUrl = registration
      ? "/auth/adid/finish"
      : safeAuthCallbackPath(
          typeof params.callbackUrl === "string" ? params.callbackUrl : null,
        );
    return (
      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-12">
        <CorePageHeader
          eyebrow="MapAble"
          title="Sign in with AD.iD"
          description="Clerk handles sign-in and account recovery for your AD.iD account."
        />
        {params.error && (
          <p role="alert">
            We could not connect your AD.iD to MapAble. If you already had a
            MapAble account, contact Australian Disability Ltd for help.
          </p>
        )}
        {config ? (
          <>
            <ClerkSignInButton callbackUrl={callbackUrl} />
            <Link
              href={{
                pathname: "/register",
                query: {
                  callbackUrl: registration?.destination ?? callbackUrl,
                },
              }}
              className="underline"
            >
              Create an AD.iD account
            </Link>
          </>
        ) : (
          <p role="status">AD.iD sign-in is temporarily unavailable.</p>
        )}
        <a className="underline" href="https://www.ausdis.com.au/contact-3">
          Get help signing in
        </a>
      </div>
    );
  }
  const oauthProviders = getConfiguredOAuthProviders();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <CorePageHeader
        eyebrow="MapAble"
        title="Sign in"
        description="Access your dashboard, care bookings, transport trips, and support tools."
        centered
        className="mb-8 border-0 pb-0"
      />
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">
            Loading sign-in form…
          </p>
        }
      >
        <LoginClient oauthProviders={oauthProviders} />
      </Suspense>
    </div>
  );
}
