"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type DownloadReportButtonProps = {
  format: "csv" | "pdf";
};

/**
 * Safe default while no authenticated, evidence-backed export endpoint exists.
 * Do not imitate a successful download using a timer or an empty file.
 */
export function DownloadReportButton({ format }: DownloadReportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      disabled
      aria-label={`${format.toUpperCase()} export unavailable until verified reporting is connected`}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {format.toUpperCase()} export unavailable
    </Button>
  );
}
