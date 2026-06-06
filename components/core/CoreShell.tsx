import { CoreFooter } from "@/components/core/CoreFooter";
import { CoreHubNav } from "@/components/core/CoreHubNav";
import { PeersSiteHeader } from "@/components/mapable-peers/PeersSiteHeader";
import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import { isPeerPeersRequest } from "@/lib/mapable-peers/peers-request";

export async function CoreShell({ children }: { children: React.ReactNode }) {
  const peerPeers = await isPeerPeersRequest();

  if (peerPeers) {
    return (
      <div className="mapable-soft flex min-h-screen flex-col bg-[#F6FBFC] text-[#0C1833]">
        <PeersSiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <CoreFooter />
      </div>
    );
  }

  return (
    <MapAbleAppShell variant="app" headerTitle="Core hub" secondaryNav={<CoreHubNav />}>
      {children}
    </MapAbleAppShell>
  );
}
