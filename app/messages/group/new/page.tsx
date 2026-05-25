import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New group chat | MapAble" };

export default async function NewGroupChatPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-heading text-2xl font-bold">Create group chat</h1>
      <p className="text-muted-foreground">
        Group creation via API is available. Use the Communication Centre inbox after
        creating a group through your coordinator or provider tools.
      </p>
      <form
        className="space-y-4 rounded-xl border border-border bg-card p-6"
        action={async (formData) => {
          "use server";
          const title = String(formData.get("title") ?? "").trim();
          const members = String(formData.get("members") ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const { createGroupChat } = await import("@/lib/messages/group-chat-service");
          const { requireAuth: auth } = await import("@/lib/auth/guards");
          const { redirect } = await import("next/navigation");
          const user = await auth();
          const names = Object.fromEntries(members.map((id) => [id, "Member"]));
          const thread = await createGroupChat({
            createdBy: user,
            title: title || "Group chat",
            memberProfileIds: members,
            memberDisplayNames: names,
          });
          redirect(`/messages/${thread.id}`);
        }}
      >
        <label htmlFor="group-title" className="text-sm font-medium">
          Group name
        </label>
        <input id="group-title" name="title" className={formInputClass} required />
        <label htmlFor="group-members" className="text-sm font-medium">
          Member profile IDs (comma separated)
        </label>
        <input id="group-members" name="members" className={formInputClass} />
        <Button type="submit" variant="default" size="default" className="min-h-11 w-full">
          Create group
        </Button>
      </form>
      <Button asChild variant="outline" size="default">
        <Link href="/messages">Back to inbox</Link>
      </Button>
    </div>
  );
}
