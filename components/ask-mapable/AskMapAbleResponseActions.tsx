import Link from "next/link";

import type { CopilotAction } from "@/lib/copilot/types";

type Props = {
  actions: CopilotAction[];
  blockedActions?: CopilotAction[];
};

function isExternalOrProtocolHref(href: string): boolean {
  return /^(https?:|tel:|sms:|mailto:)/i.test(href);
}

function ActionLink({ action }: { action: CopilotAction }) {
  const href = action.href!;
  const className =
    "flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (isExternalOrProtocolHref(href)) {
    const isWeb = /^https?:/i.test(href);
    return (
      <a
        href={href}
        className={className}
        target={isWeb ? "_blank" : undefined}
        rel={isWeb ? "noreferrer" : undefined}
      >
        <span>{action.label}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {href.startsWith("tel:") ? "Call" : isWeb ? "Open service" : "Open"}
        </span>
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <span>{action.label}</span>
      <span className="text-xs font-normal text-muted-foreground">Open</span>
    </Link>
  );
}

/**
 * Participant-facing projection of structured Copilot actions.
 *
 * This component never executes consequential MapAble actions. A structured
 * action is directly navigable only when it has an href and does not require
 * confirmation. Confirmation-bound and blocked actions remain visible as
 * information so the participant can understand what would need review.
 * Telephone/external crisis links are user-initiated navigation, not evidence
 * that an external service accepted a referral.
 */
export function AskMapAbleResponseActions({
  actions,
  blockedActions = [],
}: Props) {
  if (actions.length === 0 && blockedActions.length === 0) return null;

  return (
    <section
      aria-labelledby="ask-mapable-response-actions-heading"
      className="space-y-2 rounded-lg border border-border bg-card p-3"
    >
      <h3 id="ask-mapable-response-actions-heading" className="text-sm font-bold">
        Suggested next steps
      </h3>
      <ul className="space-y-2">
        {actions.map((action, index) => {
          const key = `${action.type}-${index}`;
          const canNavigate = Boolean(action.href) && !action.requiresConfirmation;

          return (
            <li key={key}>
              {canNavigate && action.href ? (
                <ActionLink action={action} />
              ) : (
                <div className="rounded-lg border border-border px-3 py-2 text-sm">
                  <p className="font-semibold">{action.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {action.requiresConfirmation
                      ? "Review and confirmation are required. Nothing has been changed."
                      : "Information only. No action has been taken."}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {blockedActions.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-semibold">Not available from this conversation</p>
          <ul className="mt-1 list-disc pl-5">
            {blockedActions.map((action, index) => (
              <li key={`blocked-${action.type}-${index}`}>{action.label}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
