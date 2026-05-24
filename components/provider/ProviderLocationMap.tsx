"use client";

import dynamic from "next/dynamic";

import type { ProviderWithRelations } from "./types";

const ProviderLocationMapClient = dynamic(
  () => import("@/components/provider/ProviderLocationMapClient"),
  { ssr: false },
);

type ProviderLocationMapProps = {
  provider: ProviderWithRelations;
};

export default function ProviderLocationMap(props: ProviderLocationMapProps) {
  return <ProviderLocationMapClient {...props} />;
}
