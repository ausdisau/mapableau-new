import { CommunicationPreferencesForm } from "@/components/settings/CommunicationPreferencesForm";
import { PhoneVerificationPanel } from "@/components/settings/PhoneVerificationPanel";
import { requireAuth } from "@/lib/auth/guards";
import {
  ensureDefaultCommunicationPreferences,
  getVerifiedPhoneE164,
} from "@/lib/notifications/communication-preferences";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Communication settings | MapAble Core" };

export default async function CommunicationSettingsPage() {
  const user = await requireAuth();
  await ensureDefaultCommunicationPreferences(user.id);

  const [preferences, verifiedPhone] = await Promise.all([
    prisma.communicationPreference.findMany({
      where: { userId: user.id },
      orderBy: [{ channel: "asc" }, { notificationType: "asc" }],
    }),
    getVerifiedPhoneE164(user.id),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Communication settings</h1>
        <p className="text-muted-foreground">
          Control how MapAble reaches you. MapAble is the source of truth for your
          consent and preferences; Twilio delivers SMS and voice only when you opt
          in.
        </p>
      </header>

      <PhoneVerificationPanel
        initialPhone={user.phone}
        verifiedPhone={verifiedPhone}
      />

      <CommunicationPreferencesForm
        initial={preferences.map((p) => ({
          channel: p.channel,
          notificationType: p.notificationType,
          enabled: p.enabled,
          consentStatus: p.consentStatus,
          quietHoursStart: p.quietHoursStart,
          quietHoursEnd: p.quietHoursEnd,
          accessibleCommunicationMode: p.accessibleCommunicationMode,
        }))}
      />
    </div>
  );
}
