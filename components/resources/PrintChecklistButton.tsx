"use client";

import React from "react";

import { mapablePublicSecondaryButtonClass } from "@/lib/marketing/public-page-styles";

type PrintChecklistButtonProps = {
  label?: string;
};

export function PrintChecklistButton({
  label = "Print this page",
}: PrintChecklistButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={mapablePublicSecondaryButtonClass}
    >
      {label}
    </button>
  );
}
