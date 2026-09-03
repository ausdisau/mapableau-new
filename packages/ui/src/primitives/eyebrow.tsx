import * as React from "react";

import { cn } from "../lib/cn";
import { mapableCareEyebrowClass } from "../tokens";

export interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(mapableCareEyebrowClass, className)}
      data-testid="mapable-eyebrow"
      {...props}
    >
      {children}
    </p>
  );
}
