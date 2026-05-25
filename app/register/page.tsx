import { AuthShell } from "@/components/auth/AuthShell";
import { BaseRegistrationForm } from "@/components/registration/BaseRegistrationForm";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your MapAble account"
      description="Register lightly — you can add support details when you're ready."
    >
      <BaseRegistrationForm />
      <p className="mt-4 text-sm text-slate-600 text-center">
        Already have an account?{" "}
        <a href="/login" className="text-blue-800 font-medium underline">
          Sign in
        </a>
      </p>
    </AuthShell>
  );
}
