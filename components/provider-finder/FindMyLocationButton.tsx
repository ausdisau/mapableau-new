"use client";

import React from "react";
import { Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

type FindMyLocationButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  isRequesting?: boolean;
  className?: string;
};

export function FindMyLocationButton({
  onClick,
  disabled = false,
  isRequesting = false,
  className,
}: FindMyLocationButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      className={className}
      onClick={onClick}
      disabled={disabled || isRequesting}
      aria-busy={isRequesting}
    >
      {isRequesting ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {isRequesting ? "Finding your location…" : "Find my location"}
    </Button>
  );
}
