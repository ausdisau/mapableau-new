import type { Metadata } from "next";

import { CareCombinedHomepage } from "@/components/marketing/CareCombinedHomepage";

export const metadata: Metadata = {
  title: "MapAble | Care and support, connected",
  description:
    "Find, compare and connect with disability care, accessible transport, NDIS help, inclusive jobs and accessible places in one guided platform.",
  openGraph: {
    title: "MapAble | Care and support, connected",
    description:
      "Find, compare and connect with disability care, accessible transport, NDIS help, inclusive jobs and accessible places in one guided platform.",
    type: "website",
  },
};

export default function Page() {
  return <CareCombinedHomepage />;
}
