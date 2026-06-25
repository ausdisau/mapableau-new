"use client";

import { useState } from "react";

import { ToggleGroup } from "@/components/ui/toggle-group";

export function DesignSystemToggleDemo() {
  const [value, setValue] = useState("care");
  return (
    <ToggleGroup
      label="Support type"
      name="support-type"
      value={value}
      onChange={setValue}
      options={[
        { value: "care", label: "Personal care" },
        { value: "transport", label: "Transport" },
        { value: "both", label: "Care + transport" },
      ]}
    />
  );
}
