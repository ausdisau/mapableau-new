"use client";

import type {
  AdtunisConsent,
  AdtunisWorkspace,
  Recognition,
} from "@mapable/adtunis-core";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdtunisClient } from "../client";

export function useAdtunisSession(client?: AdtunisClient) {
  const api = useMemo(() => client ?? new AdtunisClient(), [client]);
  const [workspace, setWorkspace] = useState<AdtunisWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkspace(await api.workspace());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { workspace, setWorkspace, error, loading, refresh, client: api };
}

export function useSpeechRecognition(client?: AdtunisClient) {
  const api = useMemo(() => client ?? new AdtunisClient(), [client]);
  const [status, setStatus] = useState({
    recognitionReady: false,
    simulated: true,
    detail: "Loading speech status…",
  });
  const [candidate, setCandidate] = useState<Recognition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .speechStatus()
      .then(setStatus)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Speech status failed"),
      );
  }, [api]);

  const recognizeBlob = useCallback(
    async (audio: Blob) => {
      setError(null);
      const workspace = await api.recognize(audio);
      const next = workspace.recognitions[0] ?? null;
      setCandidate(next);
      return workspace;
    },
    [api],
  );

  return { status, candidate, setCandidate, error, recognizeBlob, client: api };
}

export function useAdtunisConsent(client?: AdtunisClient) {
  const session = useAdtunisSession(client);
  const saveConsent = useCallback(
    async (consent: AdtunisConsent) => {
      const workspace = await session.client.performAction({
        type: "saveConsent",
        consent,
      });
      session.setWorkspace(workspace);
      return workspace;
    },
    [session],
  );
  return { ...session, saveConsent };
}

export function useCommunicationPreferences(client?: AdtunisClient) {
  const session = useAdtunisSession(client);
  return {
    accessibility: session.workspace?.accessibility ?? null,
    audioRetention: session.workspace?.audioRetention ?? "process-only",
    ...session,
  };
}

export function usePersonalVocabulary(client?: AdtunisClient) {
  const session = useAdtunisSession(client);
  return {
    corrections: session.workspace?.corrections ?? [],
    ...session,
  };
}

export function useAccessibleCommand(client?: AdtunisClient) {
  const session = useAdtunisSession(client);
  const run = useCallback(
    async (expression: string, idempotencyKey: string) => {
      await session.client.performAction({
        type: "confirmExpression",
        text: expression,
      });
      return session.client.confirmIntent({
        expression,
        idempotencyKey,
        confirmed: true,
      });
    },
    [session.client],
  );
  return { run, ...session };
}
