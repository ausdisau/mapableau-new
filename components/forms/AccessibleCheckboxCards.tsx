import { cn } from "@/app/lib/utils";

export function AccessibleCheckboxCards({
  legend,
  options,
  values,
  onChange,
}: {
  legend: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const checked = values.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-4",
                checked ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...values, opt.value]);
                  } else {
                    onChange(values.filter((v) => v !== opt.value));
                  }
                }}
                className="h-5 w-5"
              />
              <span className="font-medium">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
