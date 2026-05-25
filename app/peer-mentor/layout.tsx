import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { peerConfig } from "@/lib/config/peer";

export const dynamic = "force-dynamic";

export default async function PeerMentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!peerConfig.peerModuleEnabled) {
    return <p className="p-8">Peer module unavailable.</p>;
  }
  await requirePermission("peer:mentor:manage:self");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="mx-auto flex max-w-6xl gap-4 px-4 py-4" aria-label="Peer mentor">
          <Link href="/peer-mentor" className="font-heading font-bold">
            Peer mentor
          </Link>
          <Link href="/peer-mentor/profile" className="text-sm underline">
            Profile
          </Link>
          <Link href="/peer-mentor/requests" className="text-sm underline">
            Requests
          </Link>
          <Link href="/peer" className="ml-auto text-sm underline">
            Community
          </Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
