import { MapAbleMarketingFooter } from "@/components/brand/MapAbleMarketingFooter";
import { MapAbleMarketingHeader } from "@/components/brand/MapAbleMarketingHeader";

export const metadata = {
  title: "Provider Finder | MapAble",
  description:
    "Find disability support, transport, therapy and employment providers with access needs and funding filters.",
};

export default function ProviderFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MapAbleMarketingHeader />
      <div className="flex-1">{children}</div>
      <MapAbleMarketingFooter />
    </div>
  );
}
