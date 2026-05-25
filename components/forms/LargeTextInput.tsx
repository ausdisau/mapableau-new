import { cn } from "@/app/lib/utils";

export function LargeTextInput({
  id,
  label,
  value,
  onChange,
  rows = 4,
  helperText,
  error,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  helperText?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : helperText ? `${id}-hint` : undefined
        }
        className={cn(
          "w-full min-h-11 rounded-lg border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive"
        )}
      />
      {helperText ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
