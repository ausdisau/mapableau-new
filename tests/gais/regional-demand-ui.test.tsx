/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GaisRegionalDemandSummary } from "@/components/gais/GaisRegionalDemandSummary";
import { GaisRegionalDemandToggle } from "@/components/gais/GaisRegionalDemandToggle";
import type { PublicRegionalDemandFeature } from "@/lib/gais/regional-demand/public-serializer";

const feature: PublicRegionalDemandFeature = {
  type: "Feature",
  id: "gais-region-sa3-10102",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [149.05, -35.5],
        [149.4, -35.5],
        [149.4, -35.15],
        [149.05, -35.15],
        [149.05, -35.5],
      ],
    ],
  },
  properties: {
    regionCode: "10102",
    regionName: "Queanbeyan",
    regionLevel: "SA3",
    indicators: [
      {
        key: "participantScale",
        rawValue: 1694,
        unit: "participants",
        comparisonScope: "national_sa3",
        evidence: [
          {
            sourceId: "ndia",
            publisher: "NDIA",
            sourceUrl: "https://dataresearch.ndis.gov.au/",
            referencePeriod: "2026-06-30",
            retrievedAt: "2026-09-18T00:00:00.000Z",
            licenceState: "approved_public_reuse",
            confidence: "high",
            caveat: "Aggregate regional data; not individual service availability.",
          },
        ],
      },
    ],
    publicSummary: {
      evidenceCoverage: 1,
      dataAsOf: ["2026-06-30"],
    },
  },
};

describe("GaisRegionalDemandToggle", () => {
  it("does not render when the layer is disabled by configuration", () => {
    const { container } = render(
      <GaisRegionalDemandToggle
        enabled={false}
        onChange={() => undefined}
        layerEnabled={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("provides an accessible checkbox and usable hit target", () => {
    const onChange = vi.fn();
    const { container } = render(
      <GaisRegionalDemandToggle
        enabled={false}
        onChange={onChange}
        layerEnabled
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /regional service context/i,
    });
    expect(container.innerHTML).toContain("min-h-11");
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("GaisRegionalDemandSummary", () => {
  it("renders neutral evidence context and caveats", () => {
    const { container } = render(<GaisRegionalDemandSummary feature={feature} />);

    expect(screen.getByText("Queanbeyan")).toBeTruthy();
    expect(screen.getByText(/1,694 participants/i)).toBeTruthy();
    expect(screen.getByText(/100% evidence coverage/i)).toBeTruthy();
    expect(screen.getByText(/2026-06-30/i)).toBeTruthy();
    expect(screen.getByText(/NDIA/i)).toBeTruthy();
    expect(container.textContent).toMatch(
      /does not prove individual service availability or suitability/i,
    );
    expect(container.textContent).not.toMatch(/strategy score/i);
    expect(container.textContent).not.toMatch(/underserved/i);
  });
});
