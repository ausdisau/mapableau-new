import { MarketplaceOperationsLab } from "@/components/marketplace/MarketplaceOperationsLab";

export const metadata = {
  title: "Synthetic assurance workflow | MapAble Marketplace",
  description: "Exercise participant-controlled supplier, quote, delivery and refund safeguards using synthetic data only.",
  robots: { index: false, follow: false },
};

export default function MarketplaceOperationsLabPage() {
  return <MarketplaceOperationsLab />;
}
