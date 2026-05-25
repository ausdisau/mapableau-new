import Link from "next/link";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listConversationsForUser } from "@/lib/messages/message-service";
import { isAdminRole } from "@/lib/auth/roles";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/messages");

  const conversations = await listConversationsForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );

  return (
    <PageContainer title="Messages">
      {conversations.length === 0 ? (
        <p role="status" className="text-slate-600">
          No conversations yet. Message a provider from their profile.
        </p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 min-h-11 focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span className="font-medium">{c.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
