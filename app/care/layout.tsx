import { MapAbleMarketingFooter } from "@/components/brand/MapAbleMarketingFooter";
import { MapAbleMarketingHeader } from "@/components/brand/MapAbleMarketingHeader";

export default function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <MapAbleMarketingHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MapAbleMarketingFooter />
    </div>
  );
}
