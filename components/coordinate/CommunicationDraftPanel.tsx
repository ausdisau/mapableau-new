"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { CoordinateAiDisclaimer } from "./CoordinateShell";
import { CoordinateConfirmDialog } from "./CoordinateShell";

type Draft = {
  id: string;
  channel: string;
  subject?: string | null;
  body: string;
  plainLanguageBody?: string | null;
  status: string;
  confidence?: number | null;
  reason?: string | null;
};

export function CommunicationDraftPanel({
  drafts,
  onApprove,
  onUpdate,
}: {
  drafts: Draft[];
  onApprove: (draftId: string) => Promise<void>;
  onUpdate: (
    draftId: string,
    data: { subject?: string; body?: string; plainLanguageBody?: string },
  ) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    drafts[0]?.id ?? null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const selected = drafts.find((d) => d.id === selectedId);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ul className="space-y-2">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <button
                type="button"
                className={`w-full rounded-lg border p-3 text-left min-h-11 ${
                  selectedId === draft.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedId(draft.id)}
              >
                <p className="font-medium">{draft.subject ?? "Draft message"}</p>
                <Badge className="mt-2" variant="outline">
                  {draft.status}
                </Badge>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit draft</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CoordinateAiDisclaimer
                confidence={selected.confidence}
                reason={selected.reason}
              />
              <p className="text-xs text-muted-foreground">
                Approved drafts are ready for manual send only — nothing is sent
                automatically.
              </p>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Subject</span>
                <input
                  className="min-h-11 w-full rounded-md border px-3 text-sm"
                  defaultValue={selected.subject ?? ""}
                  onBlur={(e) =>
                    void onUpdate(selected.id, { subject: e.target.value })
                  }
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Formal message</span>
                  <Textarea
                    defaultValue={selected.body}
                    rows={8}
                    onBlur={(e) =>
                      void onUpdate(selected.id, { body: e.target.value })
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Plain language preview</span>
                  <Textarea
                    defaultValue={selected.plainLanguageBody ?? ""}
                    rows={8}
                    onBlur={(e) =>
                      void onUpdate(selected.id, {
                        plainLanguageBody: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
              {selected.status !== "approved" ? (
                <Button
                  variant="default"
                  size="default"
                  className="min-h-11"
                  onClick={() => setConfirmOpen(true)}
                >
                  Approve draft
                </Button>
              ) : (
                <Badge variant="secondary">Approved — send manually outside MapAble</Badge>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <CoordinateConfirmDialog
        open={confirmOpen}
        title="Approve this message draft?"
        description="This marks the draft as approved. You still send it yourself — MapAble will not transmit it."
        confirmLabel="Approve draft"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (selected) void onApprove(selected.id);
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
