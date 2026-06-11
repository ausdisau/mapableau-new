"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ConsentGate({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <p className="text-sm text-emerald-700" role="status">
        You confirmed you want to review and approve this invoice.
      </p>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base">Before you approve</CardTitle>
        <CardDescription>
          Confirm you have reviewed this invoice and understand what you are
          approving. Only you or your nominee can approve payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="default"
          size="default"
          className="min-h-11"
          disabled={disabled}
          onClick={() => {
            setConfirmed(true);
            onConfirm();
          }}
        >
          I have reviewed this invoice
        </Button>
      </CardContent>
    </Card>
  );
}
