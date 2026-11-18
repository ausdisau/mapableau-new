import {test} from 'node:test';
import assert from 'node:assert/strict';
import {detectContinuityGaps,createDecisionAuditEvent} from '../dist/index.js';

test('service continuity alerts identify operational gaps without ranking participants',()=>{
 const alerts=detectContinuityGaps([
  {id:'a',participantToken:'person-a',scheduledStart:'2026-11-19T00:00:00Z',status:'cancelled',fallbackConfirmed:false,criticalContinuity:true},
  {id:'b',participantToken:'person-b',scheduledStart:'2026-11-19T00:00:00Z',status:'completed',fallbackConfirmed:false,criticalContinuity:true},
  {id:'c',participantToken:'person-c',scheduledStart:'2026-11-19T00:00:00Z',status:'unknown',fallbackConfirmed:false,criticalContinuity:true},
 ]);
 assert.deepEqual(alerts.map(x=>x.serviceId),['a','c']);
 assert.ok(alerts.every(x=>x.action==='human_follow_up_required'));
});

test('audit event carries decision provenance without raw participant data',()=>{
 const r=createDecisionAuditEvent({eventId:'e1',algorithmId:'matching',algorithmVersion:'0.1.0',
  occurredAt:'2026-11-18T03:00:00Z',inputReferenceIds:['b','a','a'],
  outcome:'advisory',reasonCodes:['ok','ok'],humanReviewRequired:true});
 assert.deepEqual(r.inputReferenceIds,['a','b']);
 assert.deepEqual(r.reasonCodes,['ok']);
});
