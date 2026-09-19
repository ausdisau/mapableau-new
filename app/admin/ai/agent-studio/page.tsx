import type { Metadata } from "next";

import { MapAbleAgentStudio } from "@/components/ai-platform/MapAbleAgentStudio";
import {
  getMapAbleCareAgentStudioProfile,
  isMapAbleAgentStudioEnabled,
  isMapAbleAgentStudioOpenAiConfigured,
} from "@/lib/ai/platform/agent-studio/profile";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Care Agent Studio | MapAble Admin",
  description:
    "Configure and evaluate the governed MapAble Care & Support Agent using synthetic or de-identified managed sessions.",
};

export const dynamic = "force-dynamic";

export default async function MapAbleCareAgentStudioPage() {
  await requireAdmin();

  const profile = getMapAbleCareAgentStudioProfile();
  const enabled = isMapAbleAgentStudioEnabled();
  const openAiConfigured = isMapAbleAgentStudioOpenAiConfigured();
  const projectConfigured = Boolean(process.env.OPENAI_PROJECT_ID?.trim());

  return (
    <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6">
      <MapAbleAgentStudio
        enabled={enabled}
        openAiConfigured={openAiConfigured}
        projectConfigured={projectConfigured}
        profile={profile}
      />
    </div>
  );
}
