export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionStatus?: string;
  requiresHumanConfirmation?: boolean;
  toolCalls?: Array<{ toolName: string; status: string; riskLevel?: string }>;
};

export function AgentMessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col gap-4" role="log" aria-live="polite" aria-relevant="additions">
      {messages.map((msg) => (
        <article
          key={msg.id}
          className={
            msg.role === "user"
              ? "ml-auto max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground"
              : "max-w-[95%] rounded-xl border border-border bg-card px-4 py-3 text-sm"
          }
          aria-label={msg.role === "user" ? "Your message" : "Assistant message"}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </article>
      ))}
    </div>
  );
}
