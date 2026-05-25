"use client";

import { LargeSelect } from "@/components/forms/LargeSelect";

export function ProviderSearchFilters({
  supportType,
  onSupportTypeChange,
}: {
  supportType: string;
  onSupportTypeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <LargeSelect
        id="support-type"
        label="Support type"
        value={supportType}
        onChange={(e) => onSupportTypeChange(e.target.value)}
        options={[
          { value: "", label: "Any support type" },
          { value: "daily_living", label: "Daily living" },
          { value: "transport", label: "Transport" },
          { value: "community", label: "Community access" },
        ]}
        helperText="Filter the list and map together."
      />
    </div>
  );
}
