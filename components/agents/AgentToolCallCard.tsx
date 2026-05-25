type ToolCall = {
  toolName: string;
  status: string;
  riskLevel?: string;
};

export function AgentToolCallCard({ toolCalls }: { toolCalls: ToolCall[] }) {
  if (!toolCalls.length) return null;

  return (
    <div className="space-y-2" aria-label="Assistant tool activity">
      <p className="text-xs font-medium text-muted-foreground">Tool activity (summary)</p>
      <ul className="space-y-2">
        {toolCalls.map((tc, i) => (
          <li
            key={`${tc.toolName}-${i}`}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs">{tc.toolName}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span>{tc.status}</span>
            {tc.riskLevel && tc.riskLevel !== "low" ? (
              <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">
                ({tc.riskLevel} risk)
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
