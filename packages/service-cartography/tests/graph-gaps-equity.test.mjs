import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planServiceDependencies, analyseServiceGaps, auditServiceEquity } from '../dist/index.js';
import { verified, at } from './fixtures.mjs';

test('dependencies ordered before goal and cycles detected',()=>{
  const nodes=['goal','care','transport'].map((id)=>({id,kind:'service',active:true,evidence:verified}));
  const links=[{fromId:'goal',toId:'care',relation:'requires'},{fromId:'goal',toId:'transport',relation:'requires'}];
  const ok=planServiceDependencies({targetId:'goal',nodes,links,at});
  assert.equal(ok.status,'verified_dependencies');
  assert.deepEqual(ok.orderedNodeIds,['care','transport','goal']);
  const cycle=planServiceDependencies({targetId:'goal',nodes,links:[...links,{fromId:'care',toId:'goal',relation:'requires'}],at});
  assert.equal(cycle.status,'needs_review');
  assert.ok(cycle.cycles.length);
});

test('missing dependency creates a review need, not an invented provider',()=>{
  const r=planServiceDependencies({targetId:'goal',nodes:[{id:'goal',kind:'goal',active:true,evidence:verified}],
    links:[{fromId:'goal',toId:'missing-transport',relation:'requires'}],at});
  assert.equal(r.status,'needs_review');
  assert.deepEqual(r.missingNodeIds,['missing-transport']);
});

test('public service gaps suppress small groups and preserve missing data uncertainty',()=>{
  const gaps=analyseServiceGaps({
    demands:[{region:'metro',service:'care',requestedUnits:9},{region:'rural',service:'care',requestedUnits:3},{region:'metro',service:'transport',requestedUnits:7}],
    capacities:[{region:'metro',service:'care',availableUnits:5,status:'verified'},{region:'metro',service:'transport',availableUnits:null,status:'unknown'}],
    minimumAggregateCount:5});
  assert.equal(gaps.find(g=>g.region==='rural').requestedUnits,null);
  assert.equal(gaps.find(g=>g.service==='transport').unmetUnits,null);
  assert.equal(gaps.find(g=>g.service==='care'&&g.region==='metro').unmetUnits,4);
});

test('equity screen suppresses small cohorts and detects descriptive disparity only',()=>{
  const r=auditServiceEquity({cohorts:[
    {cohortId:'region-a',eligibleServiceRequests:20,fulfilledServiceRequests:18},
    {cohortId:'region-b',eligibleServiceRequests:20,fulfilledServiceRequests:2},
    {cohortId:'small-region',eligibleServiceRequests:4,fulfilledServiceRequests:0},
  ],minimumCohortSize:10,reviewThresholdPercentagePoints:0.15});
  assert.equal(r.visiblePooledRate,0.5);
  assert.equal(r.findings.find(x=>x.cohortId==='small-region').fulfilmentRate,null);
  assert.equal(r.findings.filter(x=>x.requiresHumanInvestigation).length,2);
});
