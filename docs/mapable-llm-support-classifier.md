# Support category classifier (MapAble LLM)

Server-side classification of participant free text into support **category themes** using the OpenAI **Responses API** with strict JSON schema output.

## Guardrails

This service does **not**:

- Diagnose conditions
- Decide NDIS eligibility or funding
- Finalise service or provider recommendations

Outputs include mandatory `guardrailFlags` and a participant-facing `participantSummary` in plain language.

## API

`POST /api/mapable-llm/classify-support` (session required)

```json
{
  "text": "I need help getting ready and then getting to work because buses overwhelm me",
  "correlationId": "optional-correlation-id"
}
```

Response:

```json
{
  "classification": {
    "categories": [
      {
        "code": "personal_care",
        "label": "Help getting ready",
        "confidence": 0.82,
        "reasoning": "..."
      }
    ],
    "missingInformation": ["..."],
    "guardrailFlags": ["not_a_diagnosis", "..."],
    "participantSummary": "...",
    "overallConfidence": 0.76
  },
  "audit": {
    "requestId": "uuid",
    "classifiedAt": "ISO-8601",
    "model": "gpt-4o-mini",
    "promptVersion": "support-classifier-v1",
    "inputCharacterCount": 72,
    "inputHash": "sha256-hex",
    "openaiResponseId": "resp_..."
  }
}
```

## Configuration

```env
OPENAI_API_KEY=sk-...
OPENAI_SUPPORT_CLASSIFIER_MODEL=gpt-4o-mini
```

## Modules

| Path | Role |
|------|------|
| `lib/mapable-llm/support-classifier/supportCategorySchema.ts` | Zod + JSON schema + local guardrail checks |
| `lib/mapable-llm/support-classifier/classifySupportCategory.ts` | OpenAI Responses call |
| `app/api/mapable-llm/classify-support/route.ts` | HTTP route |

## Tests

```bash
pnpm test tests/support-classifier.test.ts
```
