import { redirect } from "next/navigation";

import { ParticipantNav } from "@/components/participant/ParticipantNav";
import { SkipToContent } from "@/components/core/SkipToContent";
import { requireAuth } from "@/lib/auth/guards";
import { resolveParticipantAccess } from "@/lib/participant/participant-access";

export const metadata = {
  title: "Participant | MapAble",
  description: "Your MapAble participant home for bookings, messages and support.",
};

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth("/login");
  const access = await resolveParticipantAccess(user);

  if (!access) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <ParticipantNav userName={user.name} />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
