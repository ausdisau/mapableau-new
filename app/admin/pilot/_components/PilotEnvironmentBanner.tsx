type Props = {
  stage: string;
  limitedLiveEnabled: boolean;
  status: string;
};

/** Text labels — never colour-only. Distinguishes sandbox vs limited_live. */
export function PilotEnvironmentBanner({
  stage,
  limitedLiveEnabled,
  status,
}: Props) {
  const isLimitedLive =
    stage === "limited_live" || stage === "controlled_live";

  return (
    <div
      className="rounded-lg border p-4"
      role="status"
      aria-live="polite"
    >
      <p className="font-medium">
        Environment:{" "}
        {isLimitedLive
          ? "Limited live (controlled exposure)"
          : "Sandbox / non-live stages"}
      </p>
      <p className="mt-1 text-sm">
        Status: {status.replace(/_/g, " ")} · Stage: {stage.replace(/_/g, " ")}
        {isLimitedLive
          ? limitedLiveEnabled
            ? " · Limited live flag: enabled"
            : " · Limited live flag: disabled (blocked)"
          : " · Limited live remains off by default"}
      </p>
      <p className="mt-2 text-sm">
        Pilot approval is not production approval. Empty allowlists deny all
        support items and funding routes. There is no Submit to NDIA action on
        this surface. NdiaPilotApprovalRecord is not ControlledPilot authority.
      </p>
    </div>
  );
}
