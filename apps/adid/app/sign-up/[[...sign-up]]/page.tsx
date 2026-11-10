import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="container signin" id="main-content">
      <h1>Create your AD.iD account</h1>
      <p>
        Register with Australian Disability Ltd&apos;s AD.iD portal. This does
        not create Wix Members, MapAble, AccessiBooks, CripSquare or Disapedia
        accounts.
      </p>
      <p>
        For accessible help, contact Australian Disability Ltd. Never share
        passwords or one-time codes.
      </p>
      <SignUp />
    </main>
  );
}
