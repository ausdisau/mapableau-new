import { MarketplaceEvidencePreview } from "@/components/marketplace/MarketplaceEvidencePreview";

export const metadata = {
  title: "Evidence-first preview | MapAble Marketplace",
  description: "Synthetic accessibility-first equipment evidence comparison. No orders or payments.",
  robots: { index: false, follow: false },
};

export default function EvidencePreviewPage() {
  return <MarketplaceEvidencePreview />;
}
