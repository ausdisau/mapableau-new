import {
 matchServices, analyseServiceGaps, modelEconomicScenario, checkPolicyLabelInvariance,
 planServiceDependencies, findAccessibleRoute, proposeServiceSchedule,
} from '../dist/index.js';

// All records here are synthetic and are not actual MapAble providers or participants.
const at='2026-11-18T03:00:00Z';
const evidence={sourceId:'SYNTHETIC-VERIFICATION',status:'verified',observedAt:'2026-11-17T00:00:00Z',expiresAt:'2026-12-01T00:00:00Z'};
const person='synthetic-participant';
const request={id:'synthetic-visit',participantId:person,requiredCapabilities:['community-access'],communicationRequirements:['aac-text'],
 startsAt:'2026-11-19T00:00:00Z',endsAt:'2026-11-19T02:00:00Z',preferredProviderIds:['provider-a']};
const offer={id:'off-a',providerId:'provider-a',capabilities:['community-access'],communicationSupports:['aac-text'],
 availableFrom:'2026-11-18T00:00:00Z',availableUntil:'2026-11-20T00:00:00Z',confirmedAvailability:true,
 reliability:0.93,estimatedTravelMinutes:12,priceCentsAUD:9500,evidence};
const grant=(purpose)=>({grantId:`synthetic-${purpose}`,subjectId:person,purpose,recipientIds:['mapable-engine'],
 grantedAt:'2026-11-17T00:00:00Z',expiresAt:'2026-12-01T00:00:00Z'});
const matching=matchServices({request,offers:[offer],grants:[grant('service_matching')],at});
const schedule=proposeServiceSchedule({requests:[request],slots:[{id:'slot-a',providerId:'provider-a',resourceIds:['resource-token'],
 capabilities:offer.capabilities,communicationSupports:offer.communicationSupports,from:offer.availableFrom,
 until:offer.availableUntil,available:true,evidence}],grants:[grant('service_scheduling')],at});
const graph=planServiceDependencies({targetId:'goal',nodes:[
 {id:'goal',kind:'goal',active:true,evidence},{id:'care',kind:'service',active:true,evidence},
 {id:'transport',kind:'transport',active:true,evidence}],
 links:[{fromId:'goal',toId:'care',relation:'requires'},{fromId:'goal',toId:'transport',relation:'requires'}],at});
const route=findAccessibleRoute({originId:'a',destinationId:'b',needs:{requireStepFree:true},segments:[
 {id:'accessible-path',fromId:'a',toId:'b',travelMinutes:8,open:true,hasSteps:false,evidence}],at});
const gaps=analyseServiceGaps({demands:[{region:'synthetic-region',service:'community-access',requestedUnits:12}],
 capacities:[{region:'synthetic-region',service:'community-access',availableUnits:7,status:'verified'}]});
const needs=[{supportType:'community-access',requiredUnits:12,estimatedUnitCostCentsAUD:9500}];
const scenario={scenarioId:'synthetic-fiscal-scenario',label:'Scenario Alpha',politicalAttribution:'N/A',
 fundingCeilingCentsAUD:100000,verifiedCapacityUnits:{'community-access':7}};
const economic=modelEconomicScenario({needs,scenario});
const neutrality=checkPolicyLabelInvariance({needs,scenario,alternativeLabel:'Scenario Beta',alternativePoliticalAttribution:'Any hypothetical attribution'});
console.log(JSON.stringify({mode:'SYNTHETIC / ADVISORY ONLY',matching,schedule,graph,route,gaps,economic,neutrality},null,2));
