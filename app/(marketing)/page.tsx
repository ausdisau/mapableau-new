import type { Metadata } from "next";

import { MapAbleCareCombinedHomepageSections } from "@/components/marketing/MapAbleCareCombinedHomepage";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Page() {
  return <MapAbleCareCombinedHomepageSections />;
}
