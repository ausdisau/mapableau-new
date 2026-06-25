import type { Metadata } from "next";

import { MapAbleCareCombinedHomepageSections } from "@/components/marketing/MapAbleCareCombinedHomepage";

export const metadata: Metadata = {
  title: "MapAble | Your life, connected",
  description:
    "MapAble helps people with disability and supporters find accessible places, coordinate care, plan transport, and move toward work with confidence.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "MapAble | Your life, connected",
    description:
      "Accessibility-first ecosystem for care, transport, jobs, and evidence-based place information.",
  },
};

export default function Page() {
  return <MapAbleCareCombinedHomepageSections />;
}
