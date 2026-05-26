import { describe, expect, it } from "vitest";

import { parseProviderOutletsPayload } from "@/lib/provider-outlets";

const outlet = {
  ABN: "123",
  Prov_N: "Demo Provider",
  Head_Office: "Parramatta NSW 2150",
  Outletname: "Demo Provider",
  Flag: "O",
  Active: 1,
  Phone: "",
  Website: "",
  Email: "",
  Address: "1 Demo St, Parramatta, NSW 2150",
  State_cd: "NSW",
  Post_cd: 2150,
  Latitude: 0,
  Longitude: 0,
  RegGroup: [],
  Post_cd_p: "",
  opnhrs: "",
  prfsn: "",
};

describe("parseProviderOutletsPayload", () => {
  it("accepts canonical data wrapper", () => {
    expect(parseProviderOutletsPayload({ data: [outlet] })).toHaveLength(1);
  });

  it("accepts current public raw array file shape", () => {
    expect(parseProviderOutletsPayload([outlet])).toHaveLength(1);
  });
});
