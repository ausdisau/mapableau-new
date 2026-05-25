export function AuthErrorSummary({
  errors,
}: {
  errors: string[];
}) {
  if (errors.length === 0) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
    >
      <p className="font-medium">There was a problem signing in</p>
      <ul className="mt-2 list-disc pl-5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
