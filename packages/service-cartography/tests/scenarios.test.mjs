import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modelEconomicScenario, checkPolicyLabelInvariance } from '../dist/index.js';
const needs=[
 {supportType:'care',requiredUnits:20,estimatedUnitCostCentsAUD:5000},
 {supportType:'transport',requiredUnits:4,estimatedUnitCostCentsAUD:8000},
];
const scenario={scenarioId:'scenario-a',label:'Policy assumption A',fundingCeilingCentsAUD:100000,
 verifiedCapacityUnits:{care:15,transport:null},politicalAttribution:'not attributed'};

test('need is not reduced when the hypothetical funding ceiling decreases',()=>{
 const a=modelEconomicScenario({needs,scenario});
 const b=modelEconomicScenario({needs,scenario:{...scenario,fundingCeilingCentsAUD:0}});
 assert.deepEqual(a.requiredUnitsBySupportType,{care:20,transport:4});
 assert.deepEqual(b.requiredUnitsBySupportType,{care:20,transport:4});
 assert.equal(a.estimatedCostOfStatedNeedsCentsAUD,132000);
 assert.equal(a.estimatedFundingGapCentsAUD,32000);
 assert.equal(b.estimatedFundingGapCentsAUD,132000);
 assert.deepEqual(a.knownCapacityGapUnitsBySupportType,{care:5});
 assert.equal(a.hasUnknownCapacity,true);
});

test('political names and labels cannot affect modelled outcomes',()=>{
 const r=checkPolicyLabelInvariance({needs,scenario,alternativeLabel:'Different political label',alternativePoliticalAttribution:'Hypothetical administration'});
 assert.equal(r.passed,true);
 assert.deepEqual(r.differences,[]);
});

test('the engine cannot silently process impossible or overflowing financial figures',()=>{
 assert.throws(()=>modelEconomicScenario({needs,scenario:{...scenario,fundingCeilingCentsAUD:-1}}));
 assert.throws(()=>modelEconomicScenario({needs:[{supportType:'care',requiredUnits:10000000000000,estimatedUnitCostCentsAUD:10000000000000}],scenario}));
});

 test('prototype-like support keys are modelled as data, not inherited properties',()=>{
  const r=modelEconomicScenario({needs:[{supportType:'constructor',requiredUnits:2,estimatedUnitCostCentsAUD:200}],scenario:{...scenario,verifiedCapacityUnits:{}}});
  assert.equal(r.requiredUnitsBySupportType.constructor,2);
  assert.equal(r.hasUnknownCapacity,true);
 });
