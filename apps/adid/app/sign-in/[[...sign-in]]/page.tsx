import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="container signin" id="main-content">
      <h1>Sign in to AD.iD</h1>
      <p>
        Choose a supported sign-in method, including MFA or passkey recovery
        where configured in the Clerk development instance. For accessible help,
        contact Australian Disability Ltd. Never share passwords or one-time
        codes.
      </p>
      <SignIn />
    </main>
  );
}
