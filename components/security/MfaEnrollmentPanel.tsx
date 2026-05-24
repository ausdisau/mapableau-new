"use client";

import { useState } from "react";

import { MfaMethodList } from "@/components/security/MfaMethodList";
import { RecoveryCodesPanel } from "@/components/security/RecoveryCodesPanel";
import { TotpSetupCard } from "@/components/security/TotpSetupCard";
import type { UserRole } from "@/types/mapable";

type MfaEnrollmentPanelProps = {
  primaryRole: UserRole;
  enrollmentRequired?: boolean;
};

export function MfaEnrollmentPanel({
  primaryRole,
  enrollmentRequired = false,
}: MfaEnrollmentPanelProps) {
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      {enrollmentRequired ? (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
          role="status"
        >
          <strong className="font-semibold">MFA required for your role.</strong>{" "}
          Set up an authenticator app before using provider, finance, or admin
          features.
        </div>
      ) : null}

      {recoveryCodes ? (
        <RecoveryCodesPanel
          codes={recoveryCodes}
          onDone={() => {
            setRecoveryCodes(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      ) : (
        <TotpSetupCard
          onEnrolled={(codes) => {
            setRecoveryCodes(codes);
          }}
        />
      )}

      <MfaMethodList
        key={refreshKey}
        primaryRole={primaryRole}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
