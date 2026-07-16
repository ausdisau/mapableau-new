import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AcademySettingsPage() {
  const user = await requirePermission("academy:learn");
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-teal-950">Academy settings</h1>
      <p className="text-slate-700">
        Public credential display is{" "}
        <strong>{profile?.publicCredentialsOptIn ? "opted in" : "opted out"}</strong>.
        When opted out, verification shows the minimum necessary data without your name.
      </p>
      <p className="text-sm text-slate-600">
        Accessibility preferences continue to live in your MapAble accessibility profile.
      </p>
    </article>
  );
}
