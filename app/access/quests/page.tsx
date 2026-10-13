import { AccessQuestForm } from "@/components/access/quests/AccessQuestForm";

export const dynamic = "force-dynamic";

export default function AccessQuestsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <AccessQuestForm />
    </main>
  );
}
