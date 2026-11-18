import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findAccessibleRoute} from '../dist/index.js';
import {at,verified} from './fixtures.mjs';
const segments=[
  {id:'a-b',fromId:'a',toId:'b',travelMinutes:4,open:true,hasSteps:false,minimumClearanceMm:1000,gradientPercent:3,evidence:verified},
  {id:'b-c',fromId:'b',toId:'c',travelMinutes:5,open:true,hasSteps:false,minimumClearanceMm:1000,gradientPercent:2,evidence:verified},
  {id:'a-c-stairs',fromId:'a',toId:'c',travelMinutes:1,open:true,hasSteps:true,minimumClearanceMm:1000,gradientPercent:3,evidence:verified},
];

test('shortest accessible verified path bypasses steps',()=>{
  const r=findAccessibleRoute({originId:'a',destinationId:'c',segments,needs:{requireStepFree:true,maximumGradientPercent:5,minimumClearanceMm:850},at});
  assert.equal(r.status,'advisory_verified_route');
  assert.deepEqual(r.segmentIds,['a-b','b-c']);
  assert.equal(r.estimatedMinutes,9);
  assert.equal(r.requiresRealWorldConfirmation,true);
});

test('unknown step status and reported evidence fail closed',()=>{
  const r=findAccessibleRoute({originId:'a',destinationId:'c',segments:[
    {...segments[0],hasSteps:undefined},
    {...segments[1],evidence:{...verified,status:'reported'}}],needs:{requireStepFree:true},at});
  assert.equal(r.status,'no_verified_route');
  assert.ok(r.excluded.length>=2);
});

test('missing accessible route is not falsely declared physically impossible',()=>{
  const r=findAccessibleRoute({originId:'a',destinationId:'unknown',segments,needs:{requireStepFree:true},at});
  assert.equal(r.status,'no_verified_route');
});
