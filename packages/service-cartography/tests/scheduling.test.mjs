import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proposeServiceSchedule } from '../dist/index.js';
import { at, request, verified } from './fixtures.mjs';
const slots=[{
 id:'slot-1', providerId:'provider-preferred',resourceIds:['worker-token-1'],
 capabilities:['community-access'],communicationSupports:['aac-text'],
 from:'2026-11-19T00:00:00.000Z',until:'2026-11-19T04:00:00.000Z',available:true,evidence:verified,
},{
 id:'slot-2', providerId:'provider-other',resourceIds:['worker-token-2'],
 capabilities:['community-access'],communicationSupports:['aac-text'],
 from:'2026-11-19T00:00:00.000Z',until:'2026-11-19T04:00:00.000Z',available:true,evidence:verified,
}];
function grant(subjectId){return {
 grantId:`grant-${subjectId}`, subjectId,purpose:'service_scheduling',recipientIds:['mapable-engine'],
 grantedAt:'2026-11-01T00:00:00.000Z',expiresAt:'2026-12-01T00:00:00.000Z'};}

test('proposes appropriate slots, requiring human and participant confirmations',()=>{
 const r=proposeServiceSchedule({requests:[request],slots,grants:[grant(request.participantId)],at});
 assert.equal(r.proposals[0].providerId,'provider-preferred');
 assert.equal(r.proposals[0].requiresParticipantConfirmation,true);
 assert.equal(r.proposals[0].requiresHumanReview,true);
});

test('disallows shared resource overlapping bookings',()=>{
 const r2={...request,id:'r2',participantId:'synthetic-person-2',preferredProviderIds:[]};
 const r=proposeServiceSchedule({requests:[request,r2],slots:[slots[0]],grants:[grant(request.participantId),grant(r2.participantId)],at});
 assert.equal(r.proposals.length,1);
 assert.equal(r.notScheduled.length,1);
});

test('requires scope-specific consent for every participant',()=>{
 const r=proposeServiceSchedule({requests:[request],slots,grants:[],at});
 assert.equal(r.proposals.length,0);
 assert.equal(r.notScheduled[0].reason,'consent_required');
});

test('ignores unverified resource and unknown communication capability',()=>{
 const r=proposeServiceSchedule({requests:[request],slots:[{...slots[0],communicationSupports:[],evidence:{...verified,status:'unknown'}}],grants:[grant(request.participantId)],at});
 assert.equal(r.notScheduled[0].reason,'no_verified_suitable_capacity');
});
