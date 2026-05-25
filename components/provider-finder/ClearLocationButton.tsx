"use client";

import { Button } from "@/components/ui/button";

type ClearLocationButtonProps = {
  onClick: () => void;
  className?: string;
};

export function ClearLocationButton({ onClick, className }: ClearLocationButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={onClick}
    >
      Clear my location
    </Button>
  );
}
