import test from "node:test";
import assert from "node:assert/strict";
import {
  initialPlacesState,
  reducePlacesState,
  validateReport,
  validatePost,
  parseSavedState,
  createLocalId,
} from "../src/domain.ts";
import { parseMapAbleDirectoryResponse } from "../src/mapable.ts";

const place = {
  id: "example:library",
  name: "A sample library",
  suburb: "Sydney",
  source: "illustrative",
  category: "Library",
  sourceLabel: "Fixture",
  description: "",
  stepFree: { status: "unknown", detail: "No evidence" },
  accessibleToilet: { status: "unknown", detail: "No evidence" },
  caution: "Not verified",
};
const now = "2026-10-28T06:00:00.000Z";
const report = {
  id: "observation-1",
  placeId: place.id,
  placeName: place.name,
  feature: "entrance",
  outcome: "unsure",
  sourceType: "venue-information",
  observedOn: "2026-10-20",
  description: "The venue's public information says the east entry is step-free; this has not been checked.",
  updatedAt: now,
  status: "draft",
};
const post = {
  id: "post-1",
  circleId: "circle:books",
  circleTitle: "Sydney Book Circle",
  title: "Reading together",
  body: "Would anyone like to explore a small, relaxed local reading group?",
  updatedAt: now,
  status: "draft",
};

test("Bookmarks can be added, removed and never log visit coordinates", () => {
  const saved = reducePlacesState(initialPlacesState, {
    type: "toggle-saved", place, at: now,
  });
  assert.deepEqual(saved.savedPlaces[0], {
    id: place.id, name: place.name, suburb: place.suburb, savedAt: now,
  });
  assert.equal("latitude" in saved.savedPlaces[0], false);
  const removed = reducePlacesState(saved, { type: "remove-saved", id: place.id });
  assert.deepEqual(removed.savedPlaces, []);
});

test("Personal memory remains private and survives state export/restore", () => {
  const memory = {
    id: "memory-1", placeId: place.id, placeName: place.name,
    note: "Quiet reading room", audience: "private", updatedAt: now,
  };
  let state = reducePlacesState(initialPlacesState, { type: "save-memory", memory });
  assert.equal(state.memories[0].audience, "private");
  const updated = { ...memory, note: "Helpful tables and quiet seating." };
  state = reducePlacesState(state, { type: "save-memory", memory: updated });
  assert.equal(state.memories.length, 1);
  assert.equal(state.memories[0].note, updated.note);
  const restored = parseSavedState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  assert.deepEqual(reducePlacesState(state, {type: "delete-memory", id: memory.id}).memories, []);
});

test("Report authoring blocks incomplete or future-dated contributions", () => {
  assert.deepEqual(validateReport(report, "2026-10-28"), []);
  assert.ok(validateReport({ ...report, description: "Fine" }).some(e=>e.includes("25 characters")));
  assert.ok(validateReport({ ...report, observedOn: "2026-10-29" }, "2026-10-28").some(e=>e.includes("future")));
  assert.ok(validateReport({ ...report, observedOn: "2026-02-30" }, "2026-10-28").some(e=>e.includes("valid observation date")));
  const draft = reducePlacesState(initialPlacesState, { type: "save-report", report });
  assert.equal(draft.reports[0].status, "draft");
  const prepared = reducePlacesState(draft, { type: "prepare-report", id: report.id });
  assert.equal(prepared.reports[0].status, "prepared-for-review");
  assert.equal(prepared.reports[0].sourceType, "venue-information");
  assert.deepEqual(parseSavedState(JSON.parse(JSON.stringify(prepared))), prepared);
});

test("Community actions are local, reversible and separate from attendance", () => {
  let state = reducePlacesState(initialPlacesState, {type:"toggle-circle",circleId:"circle:books"});
  state = reducePlacesState(state, {type:"toggle-interest",eventId:"gather:books"});
  assert.deepEqual(state.joinedCircleIds, ["circle:books"]);
  assert.deepEqual(state.interestEventIds, ["gather:books"]);
  assert.deepEqual(validatePost(post), []);
  state = reducePlacesState(state, {type:"save-post",post});
  state = reducePlacesState(state, {type:"prepare-post",id:post.id});
  assert.equal(state.posts[0].status, "prepared-for-review");
  assert.deepEqual(parseSavedState(JSON.parse(JSON.stringify(state))), state);
  state = reducePlacesState(state, {type:"toggle-circle",circleId:"circle:books"});
  state = reducePlacesState(state, {type:"toggle-interest",eventId:"gather:books"});
  assert.deepEqual(state.joinedCircleIds, []);
  assert.deepEqual(state.interestEventIds, []);
});

test("Invalid stored records fail closed; reset clears everything", () => {
  assert.equal(parseSavedState({version:1,memories:[{note:"unknown"}]}), null);
  assert.equal(parseSavedState({...initialPlacesState,joinedCircleIds:["yes"],posts:[{id:"malformed"}]}), null);
  const modified = reducePlacesState(initialPlacesState, {type:"toggle-saved",place,at:now});
  assert.deepEqual(reducePlacesState(modified,{type:"reset"}), initialPlacesState);
  assert.match(createLocalId("test"), /^test-\d+-[a-z0-9]+$/);
});

test("MapAble directory conversion does not infer accessibility from a high confidence label", () => {
  const converted = parseMapAbleDirectoryResponse({
    places: [{
      id:"real-id", name:"Example venue", category:"library", suburb:"Sydney",
      confidence:"mapable_verified", features:["accessible_toilet","step_free_entry"],
      reviewCount: 10,
    },{
      id:"real-id",name:"Duplicate",category:"library",
    },{
      id:"",name:"Invalid",
    }],
  }, "https://example.com/access", "2026-10-28");
  assert.equal(converted.length,1);
  assert.equal(converted[0].id,"mapable:real-id");
  assert.equal(converted[0].stepFree.status,"unknown");
  assert.equal(converted[0].accessibleToilet.status,"unknown");
  assert.equal(converted[0].source,"mapable-directory");
});
