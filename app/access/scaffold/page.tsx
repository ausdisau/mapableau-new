import type { Metadata } from "next";

import { AccessUIScaffold } from "@/components/access/AccessUIScaffold";

export const metadata: Metadata = {
  title: "MapAble Access UI Scaffold",
  description:
    "A fixture-backed accessibility-first UI scaffold for MapAble national access discovery.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccessScaffoldPage() {
  return <AccessUIScaffold />;
}
