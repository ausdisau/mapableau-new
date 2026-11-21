import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  makePublicDirectory,
  parseGroups,
} from "../scripts/generate-provider-directory.mjs";
import {
  interpretProviderQuestion,
  matchingProviders,
  publicOpenStreetMapSearch,
} from "../src/providers.ts";

const groups = parseGroups(readFileSync(new URL("../../../app/provider-finder/regGroupOptions.ts", import.meta.url), "utf8"));
const source = [
  {
    Active: 1,
    Prov_N: "Sample Care Co",
    Head_Office: "St Ives NSW 2075",
    State_cd: "NSW", Post_cd: 2075,
    RegGroup: [5, 34],
    Address: "CONFIDENTIAL",
    Email: "person@example.invalid",
    Phone: "0400 000 000", Latitude: -33.1, Longitude: 151.1,
  },
  {
    Active: 1, Prov_N: "Sample Care Co",
    Head_Office: "St Ives NSW 2075",
    State_cd: "NSW", Post_cd: 2075, RegGroup: [34],
    Address: "18 Private Street",
  },
  {
    Active: 0, Prov_N: "Previously Listed Provider",
    Head_Office: "Sydney NSW 2000",
    State_cd: "NSW", Post_cd: 2000, RegGroup: [5],
  },
  {
    Active: 1, Prov_N: "Another Organisation",
    Head_Office: "Collingwood VIC 3066",
    State_cd: "VIC", Post_cd: 3066, RegGroup: [29],
  },
];

test("Generated records are deduplicated and strip private address, contacts and coordinates", () => {
  const result = makePublicDirectory(source, groups, "2026-10-30T00:00:00.000Z");
  assert.equal(result.providerCount, 2);
  assert.equal(result.excludedRows, 1);
  assert.equal(result.providers.find(p => p.name === "Sample Care Co")?.suburb, "St Ives");
  const serialized = JSON.stringify(result);
  for (const banned of ["person@example.invalid", "18 Private Street", "0400 000 000", "Latitude", "Longitude", "CONFIDENTIAL"]) {
    assert.equal(serialized.includes(banned), false, "Must not expose " + banned);
  }
});

test("Imported group indices are mapped to the repository registration-group taxonomy", () => {
  assert.equal(groups.get(5), "Daily Personal Activities");
  assert.equal(groups.get(34), "Support Coordination");
  const result = makePublicDirectory(source, groups, "2026-10-30T00:00:00.000Z");
  const provider = result.providers.find(p => p.name === "Sample Care Co");
  assert.deepEqual(provider?.categories, ["Daily Personal Activities", "Support Coordination"]);
});

test("Natural-language directory filtering remains local and does not infer workers", () => {
  const result = makePublicDirectory(source, groups, "2026-10-30T00:00:00.000Z");
  const intent = interpretProviderQuestion("Find support worker in NSW 2075");
  assert.deepEqual({ state:intent.state, postcode:intent.postcode, service:intent.service }, {
    state:"NSW",postcode:"2075",service:"daily-life",
  });
  const matches = matchingProviders(result.providers, {
    state:intent.state ?? "ALL", service:intent.service, query:intent.postcode ?? "",
  });
  assert.deepEqual(matches.map(p => p.name), ["Sample Care Co"]);
});

test("Offline list filters do not count excluded or unmatched entries", () => {
  const result = makePublicDirectory(source, groups, "2026-10-30T00:00:00.000Z");
  assert.equal(matchingProviders(result.providers, {state:"NSW", service:"therapy", query:""}).length, 0);
  assert.equal(matchingProviders(result.providers, {state:"VIC", service:"therapy", query:""}).length, 1);
  assert.equal(matchingProviders(result.providers, {state:"ALL", service:"all", query:"2075"}).length, 1);
});

test("OpenStreetMap receives only suburb-level location, not a precise residence", () => {
  const result = makePublicDirectory(source, groups, "2026-10-30T00:00:00.000Z");
  const url = publicOpenStreetMapSearch(result.providers[0]);
  assert.ok(url.startsWith("https://www.openstreetmap.org/search?query="));
  assert.equal(url.includes("Private%20Street"), false);
});
