import { auth } from "@clerk/nextjs/server";
import { parsePublishableKey } from "@clerk/shared/keys";
import { redirect } from "next/navigation";
import { clerkFrontendOrigin, hasClerkTenant } from "./clerk-config";

export async function requireAccessPrincipal() {
  if (!hasClerkTenant()) redirect("/sign-in");
  const { userId, sessionClaims } = await auth();
  const key = parsePublishableKey(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  const issuer = clerkFrontendOrigin(sessionClaims?.iss);
  if (!userId || !issuer || !key || issuer !== "https://" + key.frontendApi)
    redirect("/sign-in");
  return { subject: userId, issuer };
}
