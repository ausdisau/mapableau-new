import Link from "next/link";

import type { AlexaLinkStatusResponse } from "@/lib/home/adapters/alexa/types";

export type AlexaAccountLinkCardProps = {
  link: AlexaLinkStatusResponse;
  configured: boolean;
  linkingEnabled: boolean;
};

/**
 * Accessible Alexa account-link status for /my/home.
 * Voice is never the only path — keyboard/screen-reader/text controls required.
 */
export function AlexaAccountLinkCard({
  link,
  configured,
  linkingEnabled,
}: AlexaAccountLinkCardProps) {
  const statusLabel = !linkingEnabled
    ? "Alexa account linking is turned off in this environment."
    : !configured
      ? "Alexa account linking is not configured yet."
      : link.linked
        ? "Alexa is linked to your MapAble account."
        : "Alexa is not linked to your MapAble account.";

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5"
      aria-labelledby="alexa-link-heading"
    >
      <h2 id="alexa-link-heading" className="text-xl font-black text-slate-900">
        Alexa connection
      </h2>
      <p className="mt-2 text-sm text-slate-600" role="status" aria-live="polite">
        {statusLabel}
      </p>

      <dl className="mt-4 space-y-2 text-sm text-slate-700">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Status</dt>
          <dd>{link.status}</dd>
        </div>
        {link.linkedAt ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold">Linked at</dt>
            <dd>
              <time dateTime={link.linkedAt}>
                {new Date(link.linkedAt).toLocaleString("en-AU")}
              </time>
            </dd>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Home authority</dt>
          <dd>
            Account linking does not grant Home control. MapAble confirmation
            rules still apply.
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Claim state</dt>
          <dd>{link.claimState.replaceAll("_", " ")}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Real device control</dt>
          <dd>{link.realDeviceControl.replaceAll("_", " ")}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <Link
          href="/my/control"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
        >
          Review Home permissions
        </Link>
        <p className="text-sm text-slate-600">
          You can review, understand, and change MapAble Home authority using
          keyboard, screen reader, touch, or text — not voice alone. AAC text
          is treated the same as voice input.
        </p>
      </div>
    </section>
  );
}
