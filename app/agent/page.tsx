import { Suspense } from "react";

import { AgentChatPageClient } from "./AgentChatPageClient";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Agent chat | MapAble Agent",
};

export default function AgentPage() {
  return (
    <>
      <Badge
        variant="outline"
        className="mb-4 border-[#005B7F]/20 bg-[#005B7F]/5 text-[#005B7F]"
      >
        gpt-oss runtime
      </Badge>
      <h1 className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833]">
        MapAble Agent
      </h1>
      <p className="mt-3 text-lg leading-8 text-slate-600">
        Plain-language help with your NDIS plan, providers, transport, and jobs. Staff review
        sensitive steps before anything is sent or booked.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-slate-600">Loading agent…</p>}>
          <AgentChatPageClient />
        </Suspense>
      </div>
    </>
  );
}
