"use client";

import { useEffect, useRef } from "react";

export function FormErrorSummary({
  errors,
  visible,
}: {
  errors: string[];
  visible: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && ref.current) {
      ref.current.focus();
    }
  }, [visible, errors]);

  if (!visible || errors.length === 0) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-xl border-2 border-destructive bg-destructive/5 p-4"
    >
      <h3 className="font-semibold text-destructive">Please fix these issues</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
