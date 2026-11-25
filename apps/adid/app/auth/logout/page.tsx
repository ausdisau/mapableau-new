import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { hasClerkTenant } from "../../../lib/clerk-config";

export const dynamic = "force-dynamic";

export default async function LogoutPage() {
  const signedIn = hasClerkTenant() && Boolean((await auth()).userId);
  return (
    <main className="container signin" id="main-content" tabIndex={-1}>
      <h1>Sign out of AD.iD</h1>
      {signedIn ? (
        <SignOutButton redirectUrl="/">
          <button className="primary-button" type="button">
            Sign out of AD.iD
          </button>
        </SignOutButton>
      ) : (
        <p>You are signed out of this portal.</p>
      )}
      <p>
        <Link href="/">Back to AD.iD</Link>
      </p>
    </main>
  );
}
