import Link from "next/link";

import { SkipToContent } from "@/components/core/SkipToContent";
import { PeerBoundaryNotice } from "@/components/peer/PeerBoundaryNotice";
import { peerConfig } from "@/lib/config/peer";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { CRISIS_RESOURCES } from "@/lib/peer/peer-safety-service";

export const dynamic = "force-dynamic";

export default async function PeerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  if (!peerConfig.peerModuleEnabled) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p>MapAble Peer is not available right now.</p>
      </div>
    );
  }

  if (
    !hasPermission(user.primaryRole, "peer:access") &&
    !hasPermission(user.primaryRole, "peer:mentor:manage:self")
  ) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p>You do not have access to MapAble Peer.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <header className="border-b">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4"
          aria-label="MapAble Peer"
        >
          <Link href="/peer" className="font-heading text-lg font-bold">
            MapAble Peer
          </Link>
          <Link href="/peer/circles" className="text-sm underline">
            Circles
          </Link>
          <Link href="/peer/questions" className="text-sm underline">
            Q&A
          </Link>
          <Link href="/peer/mentors" className="text-sm underline">
            Mentors
          </Link>
          <Link href="/dashboard" className="ml-auto text-sm text-muted-foreground">
            Dashboard
          </Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-sm">
          <PeerBoundaryNotice />
          <p className="font-medium">Need help now?</p>
          <ul>
            {CRISIS_RESOURCES.map((r) => (
              <li key={r.name}>
                {r.name}
                {"phone" in r && r.phone ? ` — ${r.phone}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
