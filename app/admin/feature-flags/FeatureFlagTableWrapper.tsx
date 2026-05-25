"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FeatureFlagTable } from "@/components/feature-flags/FeatureFlagTable";

type Flag = {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  killSwitch: boolean;
  rolloutPercentage: number;
  moduleArea: string | null;
};

export function FeatureFlagTableWrapper({ flags: initial }: { flags: Flag[] }) {
  const router = useRouter();
  const [flags, setFlags] = useState(initial);

  async function onToggle(id: string) {
    const res = await fetch(`/api/admin/feature-flags/${id}/toggle`, {
      method: "POST",
    });
    if (res.ok) {
      const { flag } = await res.json();
      setFlags((prev) =>
        prev.map((f) => (f.id === id ? { ...f, enabled: flag.enabled } : f))
      );
      router.refresh();
    }
  }

  return <FeatureFlagTable flags={flags} onToggle={onToggle} />;
}
