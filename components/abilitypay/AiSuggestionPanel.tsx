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
import type { AiInvoiceSuggestion } from "@/types/abilitypay";

export function AiSuggestionPanel({ invoiceId }: { invoiceId: string }) {
  const [suggestions, setSuggestions] = useState<AiInvoiceSuggestion | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/abilitypay/invoices/${invoiceId}/ai-assist`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not load suggestions");
      }
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load suggestions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI review helper</CardTitle>
        <CardDescription>
          AI suggestion — you decide. AI cannot approve payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          AI helps you review. Only you or your nominee can approve payments.
        </p>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="min-h-11"
          disabled={loading}
          onClick={loadSuggestions}
        >
          {loading ? "Loading suggestions…" : "Get AI suggestions"}
        </Button>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {suggestions ? (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Invoice type:</strong> {suggestions.invoiceType}
            </p>
            {suggestions.missingFields.length > 0 ? (
              <div>
                <strong>Missing fields:</strong>
                <ul className="list-inside list-disc">
                  {suggestions.missingFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>All required fields appear present.</p>
            )}
            {suggestions.draftQuestions.length > 0 ? (
              <div>
                <strong>Questions for your provider:</strong>
                <ul className="list-inside list-disc">
                  {suggestions.draftQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {suggestions.duplicateLikely ? (
              <p className="text-amber-800">
                AI flagged this as a possible duplicate.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
