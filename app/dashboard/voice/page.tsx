import { VoiceRecorderPanel } from "@/components/voice/VoiceRecorderPanel";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Voice input | MapAble" };

export default async function DashboardVoicePage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Voice input</h1>
        <p className="text-muted-foreground">
          Optional voice recognition to draft care requests, transport trips, messages, and more.
          Always review and edit before submitting.
        </p>
      </header>
      <VoiceRecorderPanel />
    </div>
  );
}
