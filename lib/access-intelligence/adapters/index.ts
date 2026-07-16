/**
 * Future product adapters — typed contracts + clearly labelled mocks.
 * Do not claim live integration unless genuinely connected.
 */

export type TransportServiceSummary = {
  id: string;
  name: string;
  mode: string;
  accessible: boolean | "unknown";
  notes: string;
};

export type TransportDataAdapter = {
  readonly id: string;
  readonly mock: boolean;
  searchAccessibleServices(query: {
    nearPlaceId: string;
  }): Promise<TransportServiceSummary[]>;
  getStopPathways(stopId: string): Promise<{ pathIds: string[]; note: string }>;
  getLiveDisruptions(placeId: string): Promise<{ id: string; summary: string }[]>;
};

export type IndoorNavigationAdapter = {
  readonly id: string;
  readonly mock: boolean;
  importIndoorNodes(placeId: string): Promise<{ imported: number; note: string }>;
  mapDevicePosition(input: {
    placeId: string;
    x: number;
    y: number;
  }): Promise<{ nearestNodeId: string | null; note: string }>;
};

export type BuildingModelImporter = {
  readonly id: string;
  readonly mock: boolean;
  importNeutralGraph(payload: unknown): Promise<{
    placeId?: string;
    unsupported: string[];
    note: string;
  }>;
};

export type MessagingAdapter = {
  readonly id: string;
  readonly mock: boolean;
  sendApprovedVerification(input: {
    recipient: string;
    payload: Record<string, unknown>;
    approvalId: string;
  }): Promise<{ deliveryId: string; status: "queued" | "mock_only" }>;
};

export type BuildingManagementAdapter = {
  readonly id: string;
  readonly mock: boolean;
  readElementState(placeId: string, elementId: string): Promise<{
    status: string;
    note: string;
  }>;
  proposeEnvironmentChange(input: {
    placeId: string;
    elementId: string;
    proposal: string;
  }): Promise<{ proposalId: string; executed: false; note: string }>;
};

export type DeveloperApiAdapter = {
  readonly id: string;
  readonly mock: boolean;
  /** Read-only decision envelope — never includes personal passport fields by default. */
  buildPublicDecisionEnvelope(decision: {
    placeId: string;
    status: string;
    unknowns: string[];
    blockers: string[];
  }): Promise<Record<string, unknown>>;
};

export class MockTransportDataAdapter implements TransportDataAdapter {
  readonly id = "mock-transport";
  readonly mock = true as const;
  async searchAccessibleServices() {
    return [
      {
        id: "mock-bus-stop",
        name: "Demo Quay Stop (fictional)",
        mode: "bus",
        accessible: "unknown" as const,
        notes: "Mock adapter — not a live GTFS feed.",
      },
    ];
  }
  async getStopPathways() {
    return { pathIds: [], note: "Mock — no pathway import." };
  }
  async getLiveDisruptions() {
    return [];
  }
}

export class MockIndoorNavigationAdapter implements IndoorNavigationAdapter {
  readonly id = "mock-indoor-nav";
  readonly mock = true as const;
  async importIndoorNodes() {
    return { imported: 0, note: "Mock — indoor positioning not connected." };
  }
  async mapDevicePosition() {
    return { nearestNodeId: null, note: "Mock — no device positioning." };
  }
}

export class MockBuildingModelImporter implements BuildingModelImporter {
  readonly id = "mock-bim-importer";
  readonly mock = true as const;
  async importNeutralGraph() {
    return {
      unsupported: ["ifc_geometry"],
      note: "Mock importer — human verification required; no live BIM.",
    };
  }
}

export class MockMessagingAdapter implements MessagingAdapter {
  readonly id = "mock-messaging";
  readonly mock = true as const;
  async sendApprovedVerification(input: {
    recipient: string;
    payload: Record<string, unknown>;
    approvalId: string;
  }) {
    return {
      deliveryId: `mock-msg-${input.approvalId}`,
      status: "mock_only" as const,
    };
  }
}

export class MockBuildingManagementAdapter implements BuildingManagementAdapter {
  readonly id = "mock-bms";
  readonly mock = true as const;
  async readElementState() {
    return { status: "unknown", note: "Mock BMS — use live/ HTTP adapter when URL set." };
  }
  async proposeEnvironmentChange(input: {
    placeId: string;
    elementId: string;
    proposal: string;
  }) {
    return {
      proposalId: `prop-${input.elementId}`,
      executed: false as const,
      note: `Mock proposal only (not executed): ${input.proposal}`,
    };
  }
}

export class MockDeveloperApiAdapter implements DeveloperApiAdapter {
  readonly id = "mock-developer-api";
  readonly mock = true as const;
  async buildPublicDecisionEnvelope(decision: {
    placeId: string;
    status: string;
    unknowns: string[];
    blockers: string[];
  }) {
    return {
      placeId: decision.placeId,
      status: decision.status,
      unknowns: decision.unknowns,
      blockers: decision.blockers,
      passportFields: [],
      note: "Mock developer envelope — no personal Passport fields included.",
    };
  }
}

export function getDefaultAdapters() {
  return {
    transport: new MockTransportDataAdapter(),
    indoorNav: new MockIndoorNavigationAdapter(),
    buildingImport: new MockBuildingModelImporter(),
    messaging: new MockMessagingAdapter(),
    bms: new MockBuildingManagementAdapter(),
    developerApi: new MockDeveloperApiAdapter(),
  };
}
