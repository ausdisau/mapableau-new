import Link from "next/link";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { listParticipantMessages } from "@/lib/messages/message-panel-service";

export const metadata = { title: "Messages | Participant admin" };

export default async function ParticipantMessagesPage() {
  const user = await requireParticipantPanel();
  const conversations = await listParticipantMessages(user);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Messages</h1>
      <p className="text-sm text-muted-foreground">
        Complaints and safeguarding use dedicated channels — not general messages.
      </p>
      <PanelSection title="Conversations">
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/messages`}
                className="block rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40"
              >
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      </PanelSection>
    </div>
  );
}
