import type { MapAbleUserRole } from "@prisma/client";

import { shouldRedactField } from "@/lib/privacy/field-access-policy";
import { redactValue } from "@/lib/privacy/redaction-service";

export function RedactedField({
  fieldKey,
  value,
  role,
  isOwner,
  label,
}: {
  fieldKey: string;
  value: React.ReactNode;
  role: MapAbleUserRole;
  isOwner?: boolean;
  label?: string;
}) {
  const redacted = shouldRedactField(role, fieldKey, isOwner);
  return (
    <span>
      {label ? <span className="sr-only">{label}: </span> : null}
      {redacted ? redactValue(fieldKey) : value}
    </span>
  );
}
