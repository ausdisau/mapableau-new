export function AuraDisclaimerBanner({ scope }: { scope: "participant" | "provider" | "admin" }) {
  const audience =
    scope === "participant"
      ? "You are in control. AURA only acts within the boundaries you set."
      : scope === "provider"
        ? "AURA helps your team draft and explain — a person still confirms every action."
        : "AURA is a bounded execution layer, not unrestricted LLM tool use.";
  return (
    <div
      role="note"
      aria-label="AURA disclaimer"
      className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <p className="font-semibold">
        AURA is not sentient, not a legal representative, not medical, and not a financial adviser.
      </p>
      <p>{audience}</p>
      <p>
        A person still confirms actions that affect services, money, or safety. AURA cannot
        approve invoices, claims, or payments; alter consent; appoint delegation; decide
        incident reportability; close safeguarding cases; or release its own kill switch.
      </p>
    </div>
  );
}
