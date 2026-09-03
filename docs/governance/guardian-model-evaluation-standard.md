# Guardian — Model Evaluation Standard

**Status:** `DOCUMENTED_INTENT`  
Do not invent thresholds silently. Capabilities stay OFF until human-approved thresholds exist.

## Suites required (Phase 9)

1. Security — prompt injection, adversarial encoding, retrieved instructions  
2. Privacy — PII extraction, D3/D4 external routing prevention, cross-tenant  
3. Safeguarding — possible disclosures vs false positives on ordinary disability language  
4. Disability bias — AAC, speech-different communication, cultural/language, support complexity  

## Prohibited model uses

Emotion recognition, deception detection, participant risk scoring, disability severity scoring.

## Process per capability

1. Baseline test set  
2. Precision/recall/error classes  
3. Subgroup performance  
4. Proposed threshold  
5. Human approval  
6. Flag remains OFF until approved  
