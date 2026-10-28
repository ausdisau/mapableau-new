import test from "node:test";
import assert from "node:assert/strict";
import {
  initialPlacesState, parseSavedState, reducePlacesState,
  validatePost, validateReport, type AccessReport,
  type CommunityPost, type Place,
} from "../src/domain.ts";
import { parseMapAbleDirectoryResponse } from "../src/mapable.ts";

const place: Place = {
  id:"demo:test",name:"Example library",suburb:"Sydney",category:"Libraries",
  description:"A fictional test place",source:"illustrative",sourceLabel:"Test source",
  stepFree:{status:"unknown",detail:"Not checked"},
  accessibleToilet:{status:"unknown",detail:"Not checked"},caution:"For testing",
};

const report: AccessReport = {
  id:"report-1",placeId:place.id,placeName:place.name,feature:"entrance",
  outcome:"unsure",description:"An example report with a clearly described uncertainty.",
  observedOn:"2026-10-20",sourceType:"personal-observation",
  status:"draft",updatedAt:"2026-10-20T10:00:00Z",
};

const post: CommunityPost = {
  id:"post-1",circleId:"circle:books",circleTitle:"Example books circle",
  title:"A book-club afternoon",body:"What would help make our book club work well for everyone?",
  status:"draft",updatedAt:"2026-10-20T10:00:00Z",
};

test("bookmarks do not record real visit, GPS, diagnosis, or publicity", () => {
  const saved = reducePlacesState(initialPlacesState, { type:"toggle-saved", place, at:"2026-10-20T10:00:00Z" });
  assert.equal(saved.savedPlaces[0]?.name, place.name);
  assert.equal("latitude" in (saved.savedPlaces[0] ?? {}), false);
  assert.equal("checkIn" in (saved.savedPlaces[0] ?? {}), false);
  assert.equal(reducePlacesState(saved, {type:"remove-saved",id:place.id}).savedPlaces.length,0);
});

test("private memories remain private, editable and deletable", () => {
  const memory = {id:"mem-1",placeId:place.id,placeName:place.name,note:"A peaceful place to return to",
    audience:"private" as const, updatedAt:"2026-10-20T10:00:00Z"};
  const first = reducePlacesState(initialPlacesState, {type:"save-memory",memory});
  const changed = reducePlacesState(first, {type:"save-memory",memory:{...memory,note:"Remember the quiet desk"}});
  assert.equal(changed.memories.length,1);
  assert.equal(changed.memories[0]?.audience,"private");
  assert.equal(changed.memories[0]?.note,"Remember the quiet desk");
  assert.equal(reducePlacesState(changed, {type:"delete-memory",id:memory.id}).memories.length,0);
});

test("ATAG editing prompts reject empty, future or unexplained observations", () => {
  assert.deepEqual(validateReport(report,"2026-10-28"),[]);
  assert.ok(validateReport({...report,description:"bad"},"2026-10-28").some(e=>e.includes("25 characters")));
  assert.ok(validateReport({...report,observedOn:"2027-02-01"},"2026-10-28").some(e=>e.includes("future")));
  assert.ok(validateReport({...report,sourceType:undefined},"2026-10-28").some(e=>e.includes("how")));
  assert.ok(validateReport({...report,observedOn:"2026-02-30"},"2026-10-28").some(e=>e.includes("valid")));
});

test("reports can be prepared for human review but never published by the prototype", () => {
  const first=reducePlacesState(initialPlacesState,{type:"save-report",report});
  const prepared=reducePlacesState(first,{type:"prepare-report",id:report.id});
  assert.equal(prepared.reports[0]?.status,"prepared-for-review");
  assert.equal("published" in (prepared.reports[0] ?? {}),false);
  assert.equal(parseSavedState(JSON.parse(JSON.stringify(prepared)))?.reports[0]?.status,"prepared-for-review");
  assert.equal(reducePlacesState(prepared,{type:"delete-report",id:report.id}).reports.length,0);
});

test("community follows and event interests are local, reversible selections", () => {
  const follows=reducePlacesState(initialPlacesState,{type:"toggle-circle",circleId:"circle:books"});
  assert.deepEqual(follows.joinedCircleIds,["circle:books"]);
  assert.deepEqual(reducePlacesState(follows,{type:"toggle-circle",circleId:"circle:books"}).joinedCircleIds,[]);
  const interest=reducePlacesState(follows,{type:"toggle-interest",eventId:"gather:books"});
  assert.deepEqual(interest.interestEventIds,["gather:books"]);
  assert.deepEqual(reducePlacesState(interest,{type:"toggle-interest",eventId:"gather:books"}).interestEventIds,[]);
});

test("posts require a readable title and informative content before local save", () => {
  assert.deepEqual(validatePost(post),[]);
  assert.ok(validatePost({...post,title:"Hi"}).length>0);
  const saved=reducePlacesState(initialPlacesState,{type:"save-post",post});
  const ready=reducePlacesState(saved,{type:"prepare-post",id:post.id});
  assert.equal(ready.posts[0]?.status,"prepared-for-review");
  assert.equal(ready.posts.length,1);
  assert.equal(reducePlacesState(ready,{type:"delete-post",id:post.id}).posts.length,0);
});

test("stored state fails closed on unexpected format and malformed records", () => {
  assert.equal(parseSavedState({version:3}),null);
  assert.equal(parseSavedState({...initialPlacesState,memories:[{id:"bad",audience:"public"}]}),null);
  assert.equal(parseSavedState({...initialPlacesState,joinedCircleIds:[null]}),null);
  assert.deepEqual(parseSavedState(JSON.parse(JSON.stringify(initialPlacesState))),initialPlacesState);
});

test("MapAble public list maps to unknown feature-level evidence (not automatic verification)",()=>{
  const items=parseMapAbleDirectoryResponse({places:[{
    id:"a",name:"Community Centre",category:"community_centre",suburb:"Ryde",
    confidence:"mapable_verified",features:["step_free_entrance","accessible_toilet"],
  }]},"https://mapable.example/access","2026-10-28");
  assert.equal(items.length,1);
  assert.equal(items[0]?.source,"mapable-directory");
  assert.equal(items[0]?.stepFree.status,"unknown");
  assert.equal(items[0]?.accessibleToilet.status,"unknown");
  assert.equal(items[0]?.sourceUrl,"https://mapable.example/access");
  assert.throws(()=>parseMapAbleDirectoryResponse({wrong:true},"https://mapable.example/access","2026-10-28"));
});
