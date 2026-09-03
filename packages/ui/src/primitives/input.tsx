import * as React from "react";

import { cn } from "../lib/cn";
import { mapableSearchInputClass } from "../tokens";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(mapableSearchInputClass, className)}
      ref={ref}
      data-testid="mapable-input"
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
