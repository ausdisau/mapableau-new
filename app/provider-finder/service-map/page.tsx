import type { Metadata } from "next";

import ServiceProviderMapClient from "./ServiceProviderMapClient";

export const metadata: Metadata = {
  title: "Disability care and support provider map | MapAble",
  description: "Explore NDIS provider-location records on an accessible OpenStreetMap-compatible map with transparent evidence limits.",
};

export default function ServiceProviderMapPage() {
  return <ServiceProviderMapClient />;
}
