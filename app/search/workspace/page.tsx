import type { Metadata } from "next";

import { SearchWorkspace } from "@/components/search/workspace/SearchWorkspace";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Conversational Search",
  description:
    "Compare access evidence, follow a route and use AAC to explore MapAble.",
  referrer: "no-referrer",
  alternates: canonicalAlternate("/search/workspace"),
};

export default function ConversationalSearchPage() {
  return <SearchWorkspace />;
}
