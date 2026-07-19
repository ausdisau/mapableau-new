"use client";

import { useEffect, useState } from "react";

import { ConsentCategorySelector } from "@/components/access-passport/ConsentCategorySelector";
import { SharingStatus } from "@/components/access-passport/SharingStatus";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_ACCESS_SHARE_SETTINGS,
  type AccessShareCategory,
  type AccessShareSettings,
} from "@/types/access-passport";

type ProfileSnapshot = {
  mobilityNeeds: string[];
  communicationPreferences: string[];
  sensoryPreferences: Record<string, unknown>;
  cognitivePreferences: Record<string, unknown>;
  transportRequirements: Record<string, unknown>;
};

export function AccessPassport({
  initialProfile,
  initialShareSettings,
}: {
  initialProfile: ProfileSnapshot;
  initialShareSettings?: AccessShareSettings;
}) {
  const [shareSettings, setShareSettings] = useState<AccessShareSettings>(
    initialShareSettings ?? DEFAULT_ACCESS_SHARE_SETTINGS,
  );
  const [categories, setCategories] = useState<AccessShareCategory[]>(
    initialShareSettings?.categories ?? [],
  );
  const [recipientLabel, setRecipientLabel] = useState(
    initialShareSettings?.recipientLabel ?? "",
  );
  const [purpose, setPurpose] = useState(initialShareSettings?.purpose ?? "");
  const [expiresAt, setExpiresAt] = useState(
    initialShareSettings?.expiresAt
      ? initialShareSettings.expiresAt.slice(0, 10)
      : "",
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShareSettings(initialShareSettings ?? DEFAULT_ACCESS_SHARE_SETTINGS);
  }, [initialShareSettings]);

  async function saveSharing(active: boolean) {
    setLoading(true);
    setStatus("");
    const res = await fetch("/api/accessibility-profile/share-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categories,
        recipientLabel: recipientLabel.trim() || "Selected providers",
        purpose: purpose.trim() || "Support delivery and booking coordination",
        expiresAt: expiresAt
          ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString()
          : null,
        active,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setStatus("Could not update sharing settings. Please try again.");
      return;
    }
    const data = (await res.json()) as { shareSettings: AccessShareSettings };
    setShareSettings(data.shareSettings);
    setStatus(
      active
        ? "Sharing updated. Providers only see categories you selected."
        : "Sharing revoked for these categories.",
    );
  }

  function printSummary() {
    window.print();
  }

  return (
    <div className="space-y-8" data-testid="access-passport">
      <SharingStatus settings={shareSettings} />

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-[#0C1833]">
          Private interface preferences
        </h2>
        <p className="text-sm text-slate-600">
          Text size, contrast, motion, reading and map/list defaults stay on this
          device (and optionally your account) through Accessibility settings.
          They are never sent to providers as access requirements.
        </p>
        <a
          href="#accessibility-panel-trigger"
          className="inline-flex min-h-11 items-center font-bold text-[#005B7F] underline mapable-focus"
          onClick={(event) => {
            event.preventDefault();
            document
              .querySelector<HTMLButtonElement>(
                '[aria-label="Open accessibility settings"]',
              )
              ?.click();
          }}
        >
          Open accessibility settings
        </a>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-[#0C1833]">
          Shareable access requirements
        </h2>
        <p className="text-sm text-slate-600">
          Functional requirements only — not diagnoses. Unknown information is
          never treated as accessible. You choose what to share, with whom, why,
          and for how long.
        </p>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-bold">Mobility</dt>
            <dd>
              {initialProfile.mobilityNeeds.length
                ? initialProfile.mobilityNeeds.join(", ")
                : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="font-bold">Communication</dt>
            <dd>
              {initialProfile.communicationPreferences.length
                ? initialProfile.communicationPreferences.join(", ")
                : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="font-bold">Transport and drop-off</dt>
            <dd>
              {Object.keys(initialProfile.transportRequirements).length
                ? JSON.stringify(initialProfile.transportRequirements)
                : "Not set"}
            </dd>
          </div>
        </dl>
        <a
          href="/dashboard/accessibility/edit"
          className="inline-flex min-h-11 items-center font-bold text-[#005B7F] underline mapable-focus"
        >
          Edit access requirements
        </a>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-[#0C1833]">Sharing controls</h2>
        <ConsentCategorySelector value={categories} onChange={setCategories} />
        <AccessibleFormField id="share-recipient" label="Who will receive this">
          <input
            id="share-recipient"
            className={formInputClass}
            value={recipientLabel}
            onChange={(event) => setRecipientLabel(event.target.value)}
            placeholder="Example: My support provider for this booking"
          />
        </AccessibleFormField>
        <AccessibleFormField id="share-purpose" label="Purpose">
          <input
            id="share-purpose"
            className={formInputClass}
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Example: Plan an accessible care visit"
          />
        </AccessibleFormField>
        <AccessibleFormField
          id="share-expiry"
          label="End date (optional)"
          hint="Leave blank if sharing is only for the current booking period you describe in the purpose."
        >
          <input
            id="share-expiry"
            type="date"
            className={formInputClass}
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </AccessibleFormField>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            onClick={() => void saveSharing(true)}
            disabled={categories.length === 0}
          >
            Save and start sharing selected categories
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            loading={loading}
            onClick={() => void saveSharing(false)}
          >
            Revoke sharing
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={printSummary}
          >
            Print / download summary
          </Button>
        </div>
        {status ? (
          <p role="status" className="text-sm font-semibold text-[#0C1833]">
            {status}
          </p>
        ) : null}
      </section>
    </div>
  );
}
