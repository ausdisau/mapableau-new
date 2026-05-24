"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";

type RecoveryCodesPanelProps = {
  codes: string[];
  onDone: () => void;
};

export function RecoveryCodesPanel({ codes, onDone }: RecoveryCodesPanelProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const downloadText = codes.join("\n");

  return (
    <section
      aria-labelledby="recovery-codes-heading"
      className="space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <h2 id="recovery-codes-heading" className="text-lg font-semibold">
        Save your recovery codes
      </h2>
      <p className="text-sm text-muted-foreground">
        Store these codes somewhere safe. Each code works once if you lose access
        to your authenticator app. MapAble staff will never ask for these codes.
      </p>

      <div
        ref={printRef}
        className="rounded-md bg-muted p-4 font-mono text-sm"
        role="list"
        aria-label="Recovery codes"
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {codes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => {
            const blob = new Blob([downloadText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "mapable-recovery-codes.txt";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download codes
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => window.print()}
        >
          Print codes
        </Button>
        <Button type="button" variant="default" size="default" onClick={onDone}>
          I have saved my codes
        </Button>
      </div>
    </section>
  );
}
