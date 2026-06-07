import { SecuritySettingsForm } from "@/components/auth/SecuritySettingsForm";
import { requireAuth } from "@/lib/auth/guards";
import { isTwilio2FAEnabled } from "@/lib/auth/twilio-verify";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Security settings | MapAble Core" };

export default async function SecuritySettingsPage() {
  const user = await requireAuth();
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true },
  });
  const twilio2FAEnabled = isTwilio2FAEnabled();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Security settings</h1>
        <p className="text-muted-foreground">
          Manage the phone number used for SMS two-factor authentication on
          email and password sign-in.
        </p>
      </header>

      {twilio2FAEnabled ? (
        <p className="max-w-xl text-sm text-muted-foreground">
          Two-factor authentication is enabled. You will receive a verification
          code by SMS each time you sign in with your password.
        </p>
      ) : (
        <p className="max-w-xl text-sm text-muted-foreground">
          Two-factor authentication is not enabled yet. Save a mobile number
          here so you are ready when it is turned on.
        </p>
      )}

      <SecuritySettingsForm
        initialPhone={record?.phone ?? null}
        twilio2FAEnabled={twilio2FAEnabled}
      />
    </div>
  );
}
