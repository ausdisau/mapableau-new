"use client";

import { useEffect, useState } from "react";

import { Composer } from "@/components/virtual-persona/Composer";
import { ControlPanel } from "@/components/virtual-persona/ControlPanel";
import { ConversationPanel } from "@/components/virtual-persona/ConversationPanel";
import { PersonaIdentity } from "@/components/virtual-persona/PersonaIdentity";
import {
  createVirtualPersonaController,
  type VirtualPersonaController,
} from "@/lib/virtual-persona/controller";

export function VirtualPersonaWorkspace() {
  const [controller] = useState<VirtualPersonaController>(() =>
    createVirtualPersonaController(),
  );
  const [snapshot, setSnapshot] = useState(() => controller.getSnapshot());
  const [composer, setComposer] = useState("");
  const [liveRegion, setLiveRegion] = useState("");
  const [humanNote, setHumanNote] = useState<string | null>(null);

  const refresh = () => {
    const next = controller.getSnapshot();
    setSnapshot(next);
    setLiveRegion(next.statusMessage);
  };

  useEffect(() => {
    return () => controller.dispose();
  }, [controller]);

  const processing = snapshot.state === "processing";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
      <div className="space-y-4">
        <PersonaIdentity />
        <ConversationPanel
          history={snapshot.history}
          statusMessage={snapshot.statusMessage}
          liveRegion={liveRegion}
        />
        <Composer
          value={composer}
          processing={processing}
          onChange={(value) => {
            setComposer(value);
            controller.setComposing(value.length > 0);
            refresh();
          }}
          onSend={() => {
            void controller.send(composer).then(() => {
              setComposer("");
              refresh();
            });
          }}
          onStop={() => {
            controller.stop();
            refresh();
          }}
          onClear={() => {
            controller.clear();
            setComposer("");
            setHumanNote(null);
            refresh();
          }}
          onRetry={() => {
            void controller.retryLast().then(() => refresh());
          }}
        />
        {snapshot.lastError ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {snapshot.lastError}
          </p>
        ) : null}
        {humanNote ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            {humanNote}
          </p>
        ) : null}
      </div>

      <ControlPanel
        prefs={snapshot.prefs}
        draft={snapshot.draft}
        onPrefsChange={(partial) => {
          controller.setPrefs(partial);
          refresh();
        }}
        onEditDraft={() => {
          controller.beginDraftEdit();
          refresh();
        }}
        onRejectDraft={() => {
          controller.rejectDraft();
          refresh();
        }}
        onUpdateDraft={(body) => {
          controller.updateDraft(body);
          refresh();
        }}
        onNonAi={() => {
          controller.useNonAiFallback();
          // Fallback applies async; refresh shortly after
          window.setTimeout(() => refresh(), 0);
          refresh();
        }}
        onHumanSupport={() => {
          setHumanNote(
            "Human support: contact your support coordinator or use MapAble help channels. This demo does not open a live case or share your message automatically.",
          );
          setLiveRegion("Human support information is shown.");
        }}
      />
    </div>
  );
}
