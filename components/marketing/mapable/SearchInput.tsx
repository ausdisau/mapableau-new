import { cn } from "@/app/lib/utils";
import { mapableSearchInputClass } from "@/lib/brand/styles";

export function SearchInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "search",
  className,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "search" | "text";
  className?: string;
  describedBy?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="mapable-soft block text-sm font-medium text-mapable-navy">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-describedby={describedBy}
        className={cn(mapableSearchInputClass, "mapable-focus-ring font-mapable-soft")}
      />
    </div>
  );
}
