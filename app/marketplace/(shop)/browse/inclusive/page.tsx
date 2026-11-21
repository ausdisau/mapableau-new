import { InclusiveMarketplace } from "@/components/marketplace/InclusiveMarketplace";

export const metadata = {
  title: "Inclusive marketplace pilot | MapAble",
  description: "Synthetic product and service comparison for participants, carers and coordinators. No live purchases.",
  robots: { index: false, follow: false },
};

export default function InclusiveMarketplacePage() {
  return <InclusiveMarketplace />;
}
