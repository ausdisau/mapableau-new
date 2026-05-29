import Link from "next/link";

export function CoreAuthLinks({ mode }: { mode: "login" | "register" }) {
  if (mode === "login") {
    return (
      <p>
        No account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create account
        </Link>
      </p>
    );
  }
  return (
    <p>
      Already have an account?{" "}
      <Link href="/login" className="font-medium text-primary hover:underline">
        Sign in
      </Link>
    </p>
  );
}
