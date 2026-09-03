import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CopilotAction, CopilotActionType } from "@/lib/copilot/types";

type Props = {
  actions: CopilotAction[];
  blockedActions?: CopilotAction[];
  onAction?: (type: CopilotActionType) => void;
};

function ActionBody({
  action,
  onAction,
}: {
  action: CopilotAction;
  onAction?: (type: CopilotActionType) => void;
}) {
  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{action.label}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {action.requiresConfirmation
          ? "Requires your confirmation"
          : onAction
            ? "Tap to continue"
            : "Information only"}
      </CardContent>
    </>
  );
}

export function CopilotActionCards({
  actions,
  blockedActions = [],
  onAction,
}: Props) {
  if (actions.length === 0 && blockedActions.length === 0) return null;

  return (
    <section aria-labelledby="copilot-actions-heading">
      <h3 id="copilot-actions-heading" className="mb-3 text-base font-semibold">
        Suggested next steps
      </h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {actions.map((action, index) => (
          <li key={`${action.type}-${index}`}>
            {action.href && !onAction ? (
              <a
                href={action.href}
                className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card variant="interactive" className="h-full">
                  <ActionBody action={action} />
                </Card>
              </a>
            ) : (
              <Card
                variant="interactive"
                className="h-full"
                role={onAction ? "button" : undefined}
                tabIndex={onAction ? 0 : undefined}
                onClick={
                  onAction
                    ? () => onAction(action.type)
                    : undefined
                }
                onKeyDown={
                  onAction
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onAction(action.type);
                        }
                      }
                    : undefined
                }
              >
                <ActionBody action={action} onAction={onAction} />
              </Card>
            )}
          </li>
        ))}
      </ul>
      {blockedActions.length > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Some actions need sign-in:{" "}
          {blockedActions.map((a) => a.label).join(", ")}
        </p>
      ) : null}
    </section>
  );
}
