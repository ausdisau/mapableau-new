"use client";

import * as React from "react";

import { cn } from "@/app/lib/utils";

export type ToggleOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export type ToggleGroupProps<T extends string> = {
  label: string;
  name: string;
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function ToggleGroup<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  className,
}: ToggleGroupProps<T>) {
  const groupId = `${name}-toggle-group`;
  return (
    <fieldset className={cn("space-y-3", className)}>
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div
        id={groupId}
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => {
          const selected = value === option.value;
          const inputId = `${name}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                "inline-flex min-h-[var(--touch-target-min)] cursor-pointer items-center rounded-xl border px-4 py-2 text-sm font-semibold transition",
                "focus-within:ring-4 focus-within:ring-[hsl(var(--accent)/0.4)]",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-foreground hover:border-primary/40",
              )}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
