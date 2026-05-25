import { SkipToContent } from "@/components/core/SkipToContent";
import { PortalNav } from "@/components/core/PortalNav";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { PARTICIPANT_NAV_LINKS } from "@/lib/core-ui/participant-nav";

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireParticipantPanel();

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <PortalNav
        title="Participant admin"
        links={PARTICIPANT_NAV_LINKS}
        backHref="/dashboard"
        backLabel="Core dashboard"
      />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
