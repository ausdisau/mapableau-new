"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { CopilotPanel } from "@/components/copilot/CopilotPanel";

export function AskPageClient() {
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => {
    const provider = searchParams.get("provider")?.trim();
    if (!provider) return undefined;
    const name = provider.replace(/-/g, " ");
    return `Tell me about ${name} and what supports they offer`;
  }, [searchParams]);

  return <CopilotPanel initialQuery={initialQuery} />;
}
