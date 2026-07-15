"use client";

import React, { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";

export function ApprovalCard({
  title,
  recipient,
  purpose,
  fieldsOrQuestions,
  durationLabel,
  onApprove,
  onCancel,
}: {
  title: string;
  recipient: string;
  purpose: string;
  fieldsOrQuestions: string[];
  durationLabel?: string;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="rounded-2xl border-2 border-[#005B7F] bg-white p-4 shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
    >
      <h3 id={titleId} className="text-base font-black text-[#0C1833]">
        {title}
      </h3>
      <dl className="mt-3 space-y-2 text-sm text-slate-800">
        <div>
          <dt className="font-semibold">Recipient</dt>
          <dd>{recipient}</dd>
        </div>
        <div>
          <dt className="font-semibold">Purpose</dt>
          <dd>{purpose}</dd>
        </div>
        {durationLabel ? (
          <div>
            <dt className="font-semibold">Duration</dt>
            <dd>{durationLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold">What will be shared or sent</dt>
          <dd>
            <ul className="mt-1 list-disc pl-5">
              {fieldsOrQuestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="default" size="default" type="button" onClick={onApprove}>
          Approve
        </Button>
        <Button size="default" type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
