import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { hasClerkTenant } from "../../../lib/clerk-config";
import { serviceFor, supportHref } from "../../../lib/service-directory";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[] }>;
}) {
  const service = serviceFor((await searchParams).service);
  const suffix = service ? "?service=" + service.id : "";
  const after = service ? "/continue/" + service.id : undefined;
  return (
    <main className="container signin" id="main-content">
      <Link className="brand" href="/" aria-label="AD.iD home">
        AD<span className="accent">.iD</span>
      </Link>
      <h1>Sign in to AD.iD</h1>
      {hasClerkTenant() ? (
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl={"/sign-up" + suffix}
          forceRedirectUrl={after}
        />
      ) : (
        <p role="status">
          Sign-in is unavailable in this deployment. You can still explore the
          services from the home page.
        </p>
      )}
      <p>
        <Link href={"/sign-up" + suffix}>Create an AD.iD account</Link>
      </p>
      <a href={supportHref}>Get help signing in</a>
    </main>
  );
}
