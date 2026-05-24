"use client";

type BookingType = "care" | "transport" | "care_transport";

export function BookingTypeSelector({
  value,
  onChange,
}: {
  value: BookingType;
  onChange: (v: BookingType) => void;
}) {
  const options: { value: BookingType; label: string; help: string }[] = [
    {
      value: "care",
      label: "Care support",
      help: "In-home or community support from a care provider.",
    },
    {
      value: "transport",
      label: "Accessible transport",
      help: "Wheelchair-accessible or assisted transport.",
    },
    {
      value: "care_transport",
      label: "Care + transport bundle",
      help: "Support session with linked transport there and back.",
    },
  ];

  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-semibold">What do you need?</legend>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer gap-3 rounded-lg border p-4 focus-within:ring-2 focus-within:ring-primary"
        >
          <input
            type="radio"
            name="bookingType"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-1 h-5 w-5"
            aria-label={opt.label}
          />
          <span>
            <span className="block font-medium">{opt.label}</span>
            <span className="block text-sm text-muted-foreground">
              {opt.help}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
