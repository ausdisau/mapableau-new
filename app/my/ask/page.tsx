import { AssistantShell } from "@/components/personal-agency/AssistantShell";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "Ask | My MapAble" };

export default async function MyAskPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePersonalAgencyGate();
  const { q } = await searchParams;

  return <AssistantShell initialPrompt={q} />;
}
