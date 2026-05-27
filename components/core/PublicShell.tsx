import { MapAbleMarketingFooter } from "@/components/brand/MapAbleMarketingFooter";
import { MapAbleMarketingHeader } from "@/components/brand/MapAbleMarketingHeader";

/** Marketing-style shell shared by Access, provider finder, and landing pages. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <MapAbleMarketingHeader />
      <main className="flex-1">{children}</main>
      <MapAbleMarketingFooter />
    </div>
  );
}
