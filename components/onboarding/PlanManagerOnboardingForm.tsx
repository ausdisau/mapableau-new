"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import { VerificationNotice } from "@/components/onboarding/VerificationNotice";
import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";

export function PlanManagerOnboardingForm() {
  const router = useRouter();
  const [organisationName, setOrg] = useState("");
  const [abnOrNzbn, setAbn] = useState("");
  const [primaryContactName, setContact] = useState("");
  const [invoiceReceivingEmail, setEmail] = useState("");
  const [paymentProcessingContact, setPayment] = useState("");
  const [complianceAcknowledgement, setCompliance] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await postOnboarding("/api/onboarding/plan-manager", {
          organisationName,
          abnOrNzbn,
          primaryContactName,
          invoiceReceivingEmail,
          paymentProcessingContact: paymentProcessingContact || undefined,
          complianceAcknowledgement,
        });
        setLoading(false);
        if (!result.success) {
          setErrors(fieldErrorsToMap(result.errors));
          return;
        }
        router.push("/onboarding/complete");
      }}
      noValidate
    >
      <RegistrationErrorSummary errors={errors} />
      <VerificationNotice message="Invoice access requires participant or nominee consent before viewing billing data." />
      <AccessibleFormField id="organisationName" label="Organisation name" required error={errors.organisationName}>
        <input id="organisationName" className={formInputClass} value={organisationName} onChange={(e) => setOrg(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="abnOrNzbn" label="ABN or NZBN" required error={errors.abnOrNzbn}>
        <input id="abnOrNzbn" className={formInputClass} value={abnOrNzbn} onChange={(e) => setAbn(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="primaryContactName" label="Primary contact" required error={errors.primaryContactName}>
        <input id="primaryContactName" className={formInputClass} value={primaryContactName} onChange={(e) => setContact(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="invoiceReceivingEmail" label="Invoice receiving email" required error={errors.invoiceReceivingEmail}>
        <input id="invoiceReceivingEmail" type="email" className={formInputClass} value={invoiceReceivingEmail} onChange={(e) => setEmail(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="paymentProcessingContact" label="Payment processing contact (optional)" error={errors.paymentProcessingContact}>
        <input id="paymentProcessingContact" className={formInputClass} value={paymentProcessingContact} onChange={(e) => setPayment(e.target.value)} />
      </AccessibleFormField>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={complianceAcknowledgement} onChange={(e) => setCompliance(e.target.checked)} /> Compliance acknowledgement</label>
      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
