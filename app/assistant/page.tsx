import { redirect } from "next/navigation";

import { AgentChatPanel } from "@/components/agents/AgentChatPanel";
import { getCurrentUser } from "@/lib/auth/current-user";
import { agentsConfig } from "@/lib/config/agents";

export const metadata = {
  title: "MapAble Assistant",
  description: "Accessibility-first AI assistant for MapAble participants and providers",
};

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold">MapAble Assistant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Plain-language help with bookings, invoices, consent, and support. Drafts only —
          you confirm important actions.
        </p>
        {!agentsConfig.agentsEnabled ? (
          <p
            className="mt-3 rounded-lg border border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-50"
            role="status"
          >
            Assistants are disabled in this environment. Enable{" "}
            <code className="text-xs">AGENTS_ENABLED=true</code> to use this feature.
          </p>
        ) : null}
      </header>
      <AgentChatPanel />
    </main>
  );
}
