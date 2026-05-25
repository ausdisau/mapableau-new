import { cn } from "@/app/lib/utils";

export function AccessibleRadioCards({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex min-h-11 cursor-pointer flex-col rounded-xl border p-4",
              value === opt.value
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="h-5 w-5"
              />
              <span className="font-medium">{opt.label}</span>
            </span>
            {opt.description ? (
              <span className="mt-1 pl-8 text-sm text-muted-foreground">
                {opt.description}
              </span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
