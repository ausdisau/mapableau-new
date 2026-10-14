"use client";

import { AccessibleAutocomplete } from "@/components/search/AccessibleAutocomplete";
import {
  resolveStreetAddressSuggestion,
  type ResolvedStreetAddress,
} from "@/lib/addresses/resolve-street-address";
import type { AutocompleteContext, AutocompleteSuggestion } from "@/types/search";

export type StreetAddressAutocompleteProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called after a suggestion is selected (and optionally resolved). */
  onResolved?: (address: ResolvedStreetAddress) => void;
  context: Extract<
    AutocompleteContext,
    "booking" | "transport_request" | "care_request"
  >;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  /** @default 300 — use 0 in tests */
  debounceMs?: number;
};

const DEFAULT_HELPER =
  "Start typing for Australian street suggestions. You can also enter an address manually.";

export function StreetAddressAutocomplete({
  id,
  label,
  value,
  onChange,
  onResolved,
  context,
  placeholder = "Street address, suburb",
  helperText = DEFAULT_HELPER,
  disabled,
  required,
  className,
  inputClassName,
  debounceMs,
}: StreetAddressAutocompleteProps) {
  async function handleSelect(suggestion: AutocompleteSuggestion) {
    onChange(suggestion.value);
    const resolved = await resolveStreetAddressSuggestion(suggestion);
    onChange(resolved.formattedAddress);
    onResolved?.(resolved);
  }

  return (
    <AccessibleAutocomplete
      id={id}
      label={label}
      placeholder={placeholder}
      context={context}
      field="location"
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      helperText={helperText}
      disabled={disabled}
      required={required}
      className={className}
      inputClassName={inputClassName}
      debounceMs={debounceMs}
    />
  );
}
