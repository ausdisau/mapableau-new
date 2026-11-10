import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="landing container" id="main-content">
      <p>Australian Disability Ltd</p>
      <h1>
        AD<span className="accent">.iD</span>
      </h1>
      <h2>Your services, your choice.</h2>
      <p>Secure and accessible access to Australian Disability services.</p>
      <Suspense fallback={<p role="status">Loading sign-in options…</p>}>
        <Show when="signed-out">
          <p>
            <Link className="primary-button" href="/sign-in">
              Sign in securely
            </Link>
          </p>
          <p>
            <Link href="/sign-up">Create an AD.iD account</Link>
          </p>
        </Show>
        <Show when="signed-in">
          <p>
            <Link className="primary-button" href="/dashboard">
              Go to your service control centre
            </Link>
          </p>
          <p>
            <Link href="/account">Manage account and security</Link>
          </p>
        </Show>
      </Suspense>
      <p>
        AD.iD sign-in does not automatically grant access to MapAble,
        AccessiBooks, CripSquare, Disapedia or Wix Members.
      </p>
    </main>
  );
}
