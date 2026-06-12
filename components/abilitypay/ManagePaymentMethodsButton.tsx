"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ManagePaymentMethodsButtonProps = {
  apiPath?: string;
  returnPath?: string;
  participantId?: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
  onError?: (message: string) => void;
};

export function ManagePaymentMethodsButton({
  apiPath = "/api/abilitypay/billing-portal",
  returnPath,
  participantId,
  variant = "outline",
  size = "default",
  className,
  label = "Manage payment methods",
  onError,
}: ManagePaymentMethodsButtonProps) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnPath,
          participantId,
        }),
      });
      const data = (await res.json()) as {
        portalUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.portalUrl) {
        const message = data.error ?? "Billing portal is not available";
        onError?.(message);
        return;
      }
      window.location.href = data.portalUrl;
    } catch {
      onError?.("Could not open billing portal. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={() => void openPortal()}
    >
      {loading ? "Opening portal…" : label}
    </Button>
  );
}
