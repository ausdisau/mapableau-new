interface RegistrationErrorSummaryProps {
  errors: Record<string, string>;
  title?: string;
}

export function RegistrationErrorSummary({
  errors,
  title = "Please fix the following before continuing",
}: RegistrationErrorSummaryProps) {
  const entries = Object.entries(errors).filter(([, msg]) => msg);
  if (entries.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4"
    >
      <h2 className="text-base font-semibold text-destructive">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#${field.replace(/\./g, "-")}`} className="underline">
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
