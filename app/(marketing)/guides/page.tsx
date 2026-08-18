import React from "react";

import { LocalAccessGuidesDirectory } from "@/components/resources/LocalAccessGuidesDirectory";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import {
  accessGuides,
  getCapitalAccessGuides,
} from "@/lib/resources/access-guides-data";

export const metadata = {
  title: "Local Access Guides | MapAble",
  description:
    "MapAble Local Access Guides for Australian capital cities and regional locations — practical accessibility planning for visitors and locals.",
  alternates: canonicalAlternate("/guides"),
};

export default function GuidesIndexPage() {
  const capitalGuides = getCapitalAccessGuides();

  return (
    <LocalAccessGuidesDirectory
      guides={accessGuides}
      capitalGuides={capitalGuides}
    />
  );
}
