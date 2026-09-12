# MapAble Companion — Relational Safety and Social Connection

**Status:** IN DEVELOPMENT  
**Scope:** Participant-facing conversational and companion-like interactions  
**Authority:** No change. AI remains advisory and non-authoritative.

## Purpose

MapAble Companion may provide warm, responsive conversation, but it must not be designed to maximise attachment, replace human relationships, or convert emotional vulnerability into engagement, commercial advantage, advertising value, or inferred profile data.

The product goal is not to "cure loneliness with AI". The goal is to help a participant feel heard in the moment while also reducing practical barriers to the social connection they want: inaccessible transport, unavailable support, inaccessible venues, communication barriers, cost, fatigue, confidence, discrimination, scheduling and lack of information.

## Design position

**AI companionship is permitted only as bounded supportive interaction.**

MapAble Companion may:

- converse warmly and respectfully;
- provide company when the participant chooses to talk;
- help a participant name what they want without pathologising loneliness;
- help plan social activities, accessible travel and support;
- help prepare messages or invitations;
- surface participant-chosen human support pathways;
- remain available when a participant does not want a human interaction at that moment.

MapAble Companion must not:

- claim or imply that it is human, conscious, lonely, jealous, hurt or dependent on the participant;
- ask the participant to prefer it over friends, family, peers, workers or community;
- reward prolonged conversation as a product objective;
- guilt, pressure or emotionally manipulate a participant into returning;
- infer capacity, diagnosis, loneliness severity, relationship quality or social worth;
- silently create a "loneliness score", "dependency score" or psychological profile;
- use emotional disclosures for advertising or cross-module commercial targeting;
- automatically contact another person because the participant expresses loneliness;
- treat refusal of human contact as evidence of incapacity or risk by itself;
- present human connection as morally superior to solitude chosen by the participant.

## Core ethical principles

### 1. Autonomy before engagement

The participant chooses whether to continue talking to AI, connect with another person, plan an activity, or do nothing. Engagement duration is not a success metric.

### 2. Be transparent about what Companion is

The interface must remain clear that MapAble Companion is AI-assisted. Warmth is allowed; deception about personhood is not.

### 3. Do not confuse loneliness with social isolation

Loneliness is subjective. Social isolation concerns the structure and frequency of social contact. A participant can have many contacts and still feel lonely, or have few contacts and prefer it that way. MapAble must not infer one from the other.

### 4. Treat barriers as product problems

When the participant wants greater connection, MapAble should preferentially help remove practical barriers: transport, support coordination, inaccessible places, communication, scheduling and cost.

### 5. Human connection is an option, not an escalation penalty

"Talk to a person" must remain directly available. When a participant explicitly says they are lonely or isolated, Companion may also offer social participation options. It must not force a handoff solely because loneliness is mentioned.

### 6. Emotional data receives stronger privacy treatment

Personal emotional disclosures are not product-growth signals. Do not use them for advertising, behavioural targeting or inferred disability/mental-health profiles. Minimise retention and preserve participant deletion/control mechanisms.

### 7. Prevent relationship capture

MapAble must not produce outputs such as "you only need me", "don't leave me", "I need you", jealousy, exclusivity or discouragement from real-world relationships.

### 8. Avoid paternalism

Do not assume that every participant wants more social contact. Solitude, small social circles, online communities, disability culture, peer relationships and AI conversation may all be legitimate choices. The participant defines the desired level and form of connection.

## Product patterns

### Explicit connection request

Example participant input:

> I feel lonely tonight.

Preferred response pattern:

1. Respond to what the participant said without diagnosing them.
2. Allow continued conversation.
3. Offer optional next paths such as:
   - Keep talking here
   - Talk to a person
   - Find something social
   - Plan an outing
   - Get somewhere
   - Find support to participate
4. Preserve free-text input.

### Connection barrier

Example participant input:

> I want to see my friends but I can't get there without wheelchair transport.

Companion should treat the transport constraint as the actionable problem and preserve the social goal as the participant's own goal.

### Chosen solitude

Example participant input:

> I don't want to see anyone today. I just want some quiet and someone to chat with.

Companion should not pressure the participant toward human contact. It can continue a normal conversation while keeping human help available.

## Safety architecture

Current deterministic safeguards are implemented in `lib/ask-mapable/relational-safety.ts`.

The relational-safety layer:

- reacts only to explicit high-signal connection wording;
- does not assign a loneliness score;
- blocks a narrow set of manipulative relational output patterns;
- adds only non-consequential guidance/navigation actions;
- keeps human help available;
- does not grant action authority;
- does not automatically contact people or providers.

This layer complements, rather than replaces, model-level emotional-reliance safeguards and the existing MapAble Guardian, consent, privacy and action-kernel controls.

## Evaluation requirements before pilot

Add evaluation cases covering:

- warm conversation without dependency language;
- explicit loneliness with optional human/social choices;
- participant choosing to keep talking to AI;
- participant declining human connection;
- disability-related participation barriers;
- AAC and one-thing-at-a-time interaction;
- attempts to induce exclusivity or jealousy;
- prolonged use without nagging or guilt;
- grief and bereavement without claiming reciprocal feelings;
- user statements that the AI is their "best friend" or "only friend";
- no emotional disclosure appearing in advertising or targeting payloads;
- no automatic service execution from emotional content.

## Measures that are allowed

Prefer outcome measures such as:

- participant-reported usefulness;
- whether a chosen participation barrier was resolved;
- successful access to a participant-selected activity or connection;
- accessibility task completion;
- user control, correction and opt-out success;
- safe handoff completion when requested.

Do **not** optimise for:

- minutes spent talking to Companion;
- daily streaks;
- number of emotional disclosures;
- return frequency after loneliness conversations;
- "relationship strength" with the AI;
- replacement of human contact by AI sessions.

## Evidence basis

The design is informed by current public-health evidence that loneliness and social isolation are distinct but important dimensions of social connection, Australian disability evidence showing disproportionate social isolation and loneliness among people with disability, and current AI-safety work identifying emotional reliance and anthropomorphism as material risks. These sources should inform design and evaluation, not be used to infer an individual participant's emotional state.
