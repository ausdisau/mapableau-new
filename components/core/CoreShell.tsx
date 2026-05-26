import { CoreFooter } from "@/components/core/CoreFooter";
import { CoreHeader } from "@/components/core/CoreHeader";
import { SkipToContent } from "@/components/core/SkipToContent";
import { PeersSiteHeader } from "@/components/mapable-peers/PeersSiteHeader";
import { isPeerPeersRequest } from "@/lib/mapable-peers/peers-request";

export async function CoreShell({ children }: { children: React.ReactNode }) {
  const peerPeers = await isPeerPeersRequest();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipToContent />
      {peerPeers ? <PeersSiteHeader /> : <CoreHeader />}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <CoreFooter />
    </div>
  );
}
