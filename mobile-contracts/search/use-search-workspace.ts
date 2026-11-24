import { useEffect, useReducer, useState } from "react";

import {
  initialState,
  loadPublicTopics,
  reduceSearch,
  selectedClinic,
  type DirectoryHit,
  type Scope,
} from "./workspace";

export function useSearchWorkspace(origin: string) {
  const [state, dispatch] = useReducer(reduceSearch, initialState);
  const [attempt, setAttempt] = useState(0);
  const [directory, setDirectory] = useState<{
    scope: Scope;
    hits: DirectoryHit[];
    error: boolean;
    attempt: number;
  }>();
  const browse =
    !state.demo &&
    (state.question !== "" ||
      state.presentation === "Web" ||
      state.scope !== "All");
  useEffect(() => {
    if (!browse) {
      setDirectory(undefined);
      return;
    }
    const controller = new AbortController();
    const scope = state.scope;
    loadPublicTopics(origin, scope, controller.signal)
      .then((hits) => {
        if (!controller.signal.aborted)
          setDirectory({ hits, scope, error: false, attempt });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setDirectory({ hits: [], scope, error: true, attempt });
      });
    return () => controller.abort();
  }, [origin, state.scope, browse, attempt]);
  const current =
    browse && directory?.scope === state.scope && directory.attempt === attempt
      ? directory
      : undefined;
  return {
    state,
    dispatch,
    selected: selectedClinic(state),
    browse,
    directory: current,
    retry: () => setAttempt((n) => n + 1),
  };
}
