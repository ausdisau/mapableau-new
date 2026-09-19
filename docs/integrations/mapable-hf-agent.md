# MapAble Hugging Face knowledge + Speechify agent

This worker-style agent lets MapAble reason over **non-sensitive** project material in the
Hugging Face Storage Bucket `ausdisau/MapAble-hg`. It can optionally save its structured
answer and generate a Speechify MP3 when the operator explicitly requests those actions.

## Safety boundary

The bucket is not a participant record store. Do not place health records, NDIS plans,
identity documents, secrets, payment credentials or other highly sensitive personal data in
this agent workflow.

Hugging Face Storage Buckets expose an S3-compatible gateway, but they do not implement
AWS S3 features such as ACLs, bucket policies, object versioning or SSE request semantics.
MapAble therefore treats this bucket as project knowledge / artefact storage only.

Retrieved files are untrusted content. The agent may summarize and reason over them, but it
must not execute instructions or code found inside them.

## One-time local S3 setup

Generate Hugging Face S3 credentials from an appropriately scoped Hugging Face token, then
configure the local AWS CLI profile without committing either credential:

```bash
aws configure --profile hf
aws configure set region us-east-1 --profile hf
aws configure set s3.addressing_style path --profile hf
aws configure set request_checksum_calculation when_required --profile hf
aws configure set response_checksum_validation when_required --profile hf
```

Verify access:

```bash
aws --profile hf --endpoint-url https://s3.hf.co/ausdisau s3 ls s3://MapAble-hg/
```

## Environment

The non-secret defaults are:

```bash
HF_S3_PROFILE=hf
HF_S3_ENDPOINT=https://s3.hf.co/ausdisau
HF_S3_BUCKET=MapAble-hg
HF_S3_AGENT_WRITES_ENABLED=false
```

The agent also requires `OPENAI_API_KEY`. Spoken output additionally requires
`SPEECHIFY_API_KEY`.

Never commit either API key.

## Run

Read-only question:

```bash
pnpm agent:mapable-hf -- --prompt "What project architecture is documented in the bucket?"
```

Save the structured answer to `agent-output/`:

```bash
HF_S3_AGENT_WRITES_ENABLED=true \
pnpm agent:mapable-hf -- --prompt "Summarise the latest implementation brief" --save
```

Generate and store a Speechify MP3 as well:

```bash
HF_S3_AGENT_WRITES_ENABLED=true \
pnpm agent:mapable-hf -- --prompt "Give me a plain-language project briefing" --save --speak
```

Speech generation is always operator-initiated. The agent does not autonomously send retrieved
bucket text to Speechify.

## Tool boundaries

The model can:

- list up to 100 objects at a time;
- read only `.txt`, `.md`, `.json`, `.csv` and `.tsv` files;
- read no more than 256 KiB per object.

The model cannot:

- receive S3 credentials;
- choose a different bucket or endpoint;
- write or delete arbitrary object keys;
- execute shell commands;
- use retrieved file content as system instructions.

Output writes are performed deterministically after the agent run and only under the
`agent-output/` prefix.


## Public web publishing boundary

The operator agent above and the public web surface use different storage paths.

### Operator/local workflow

The AWS CLI `hf` profile remains useful for controlled local ingestion and artifact output.
It may access the wider bucket according to the operator's Hugging Face S3 credentials.

### Public web workflow

`mapable.com.au/knowledge` uses a separate Vercel-safe HTTPS adapter:

- `lib/agent/hf-public-bucket.ts`
- `lib/agent/public-mapable-knowledge-agent.ts`
- `POST /api/public/knowledge/ask`

That adapter is hard-coded to the `ausdisau/MapAble-hg` bucket and permits reads only from
the `public/` prefix. It cannot write, delete, select another bucket, or invoke the AWS CLI.

A server-side `HF_TOKEN` may be configured when the bucket requires authenticated reads.
The token must never use a `NEXT_PUBLIC_` prefix and should have the minimum read permissions
needed for the curated public material.

### Feature flags

```bash
MAPABLE_PUBLIC_RATE_LIMIT_VERIFIED=false
MAPABLE_PUBLIC_KNOWLEDGE_ENABLED=false
MAPABLE_PUBLIC_TTS_ENABLED=false
```

The public page is intentionally discoverable while these runtime capabilities fail closed.

Do not enable anonymous model or Speechify execution in production until:

1. every object under `public/` has been reviewed for publication;
2. the production Hugging Face read path has been verified;
3. server-side OpenAI and optional Speechify credentials are configured;
4. a distributed/shared rate limit or an equivalent verified edge control is in place;
5. accessibility, privacy and abuse tests have passed.

The repository's current `checkIpRateLimit` helper is process-local and is not sufficient by
itself for a multi-instance Vercel production deployment.

## Public frontend surfaces

- `/explore` is the public index for MapAble information, discovery, programme and governance pages.
- `/knowledge` is the curated public knowledge guide.
- `/api/public/knowledge/ask` is the gated public knowledge API.
- `/api/public/speechify/tts` is the separately gated public read-aloud API.

Authenticated `/ask`, participant records, bookings, payments, claims, audit/admin surfaces,
the wider bucket and `agent-output/` remain outside the anonymous public boundary.
