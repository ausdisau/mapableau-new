import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { hasClerkTenant } from "../../../lib/clerk-config";
import { serviceFor, supportHref } from "../../../lib/service-directory";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[] }>;
}) {
  const service = serviceFor((await searchParams).service);
  const suffix = service ? "?service=" + service.id : "";
  const after = service ? "/continue/" + service.id : undefined;
  return (
    <main className="container signin" id="main-content" tabIndex={-1}>
      <Link className="brand" href="/" aria-label="AD.iD home">
        AD<span className="accent">.iD</span>
      </Link>
      <h1>Create your AD.iD account</h1>
      <p>
        Use this account to identify yourself to participating services. You can
        choose which services to open.
      </p>
      {hasClerkTenant() ? (
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl={"/sign-in" + suffix}
          forceRedirectUrl={after}
        />
      ) : (
        <p role="status">
          Registration is unavailable in this deployment. You can still browse
          the public services.
        </p>
      )}
      <p>
        <Link href={"/sign-in" + suffix}>Sign in to an existing account</Link>
      </p>
      <a href={supportHref}>Get help registering</a>
    </main>
  );
}
