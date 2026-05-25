import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CopilotAction } from "@/lib/copilot/types";


type Props = {
  actions: CopilotAction[];
  blockedActions?: CopilotAction[];
};

export function CopilotActionCards({ actions, blockedActions = [] }: Props) {
  if (actions.length === 0 && blockedActions.length === 0) return null;

  return (
    <section aria-labelledby="copilot-actions-heading">
      <h3 id="copilot-actions-heading" className="mb-3 text-base font-semibold">
        Suggested next steps
      </h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <li key={action.type}>
            <Card variant="interactive" className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{action.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {action.requiresConfirmation
                  ? "Requires your confirmation"
                  : "Information only"}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {blockedActions.length > 0 ? (
        <div
          className="mt-4 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950/30"
          role="status"
          aria-labelledby="blocked-actions-heading"
        >
          <p id="blocked-actions-heading" className="font-medium text-foreground">
            Not available until you confirm
          </p>
          <p className="mt-1 text-muted-foreground">
            MapAble will not book, pay, claim, share records, or change official
            records without your explicit review. These steps need sign-in or
            confirmation first:
          </p>
          <ul className="mt-2 list-inside list-disc">
            {blockedActions.map((a) => (
              <li key={a.type}>{a.label}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
