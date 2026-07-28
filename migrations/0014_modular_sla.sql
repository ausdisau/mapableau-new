DO $$ BEGIN
  CREATE TYPE "sla_template_type" AS ENUM ('core', 'module');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "participant_sla_status" AS ENUM ('draft', 'active', 'superseded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "sla_templates" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "type" "sla_template_type" NOT NULL,
  "module_id" text,
  "version" integer DEFAULT 1 NOT NULL,
  "content_markdown" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sla_variants" (
  "id" serial PRIMARY KEY NOT NULL,
  "module_id" text NOT NULL,
  "variant_id" text NOT NULL,
  "name" text NOT NULL,
  "default_params" text
);

CREATE TABLE IF NOT EXISTS "participant_slas" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "participant_plan_id" varchar,
  "agreement_reference" text DEFAULT ('MAP-AG-' || to_char(CURRENT_DATE, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))) NOT NULL,
  "selected_modules" text NOT NULL,
  "custom_parameters" text,
  "content_markdown" text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "status" "participant_sla_status" DEFAULT 'draft' NOT NULL,
  "accepted_at" timestamp,
  "accepted_by_user_id" varchar,
  "acceptance_method" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "participant_slas"
    ADD CONSTRAINT "participant_slas_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "participant_slas"
    ADD CONSTRAINT "participant_slas_accepted_by_user_id_users_id_fk"
    FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "participant_slas"
    ADD CONSTRAINT "participant_slas_participant_plan_id_ndis_plan_cache_id_fk"
    FOREIGN KEY ("participant_plan_id") REFERENCES "public"."ndis_plan_cache"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "sla_templates_key_unique"
  ON "sla_templates" USING btree ("key");
CREATE INDEX IF NOT EXISTS "sla_templates_module_id_idx"
  ON "sla_templates" USING btree ("module_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sla_variants_variant_id_unique"
  ON "sla_variants" USING btree ("variant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sla_variants_module_variant_unique"
  ON "sla_variants" USING btree ("module_id", "variant_id");
CREATE INDEX IF NOT EXISTS "sla_variants_module_id_idx"
  ON "sla_variants" USING btree ("module_id");
CREATE UNIQUE INDEX IF NOT EXISTS "participant_slas_agreement_reference_unique"
  ON "participant_slas" USING btree ("agreement_reference");
CREATE UNIQUE INDEX IF NOT EXISTS "participant_slas_user_version_unique"
  ON "participant_slas" USING btree ("user_id", "version");
CREATE INDEX IF NOT EXISTS "participant_slas_user_status_idx"
  ON "participant_slas" USING btree ("user_id", "status");

INSERT INTO "sla_templates"
  ("key", "name", "type", "module_id", "version", "content_markdown")
VALUES
(
  'core-terms-v1',
  'Core Terms',
  'core',
  NULL,
  1,
  $sla$# MapAble Service Level Agreement

- **Agreement reference:** {{agreementReference}}
- **Participant:** {{participantName}}
- **NDIS number:** {{ndisNumber}}
- **Agreement date:** {{agreementDate}}
- **Plan period:** {{planStartDate}} to {{planEndDate}}

## Core Terms

### 1. Purpose and parties

This Service Agreement records the supports selected by {{participantName}}, the responsibilities of the participant and MapAble, and the service standards MapAble will apply. It is read together with each confirmed booking or schedule of supports and applicable NDIS requirements. It does not guarantee NDIS funding or NDIA payment.

### 2. Choice, control and communication

The participant directs their supports. They may ask questions, request more information, decline part of a proposed service, use a nominee, advocate or supported decision-maker, and request an accessible explanation before deciding. MapAble will communicate directly and respectfully with the participant, including when a nominee is involved, and will use the participant's preferred accessible format where reasonably practicable.

The participant may change providers or change or cancel services subject to the agreed notice terms. MapAble will not pressure the participant to accept a service or retaliate because they exercise these rights.

### 3. Fees, claims and records

The price, NDIS support item, quantity and any agreed travel, non-face-to-face, cancellation or other charge must be shown in the booking or schedule of supports before it is charged. Fees must not exceed the agreed price or an applicable NDIS price limit, and a participant will not be charged more solely because they receive NDIS funding.

MapAble will keep accurate, timely service and billing records so charges can be understood and checked. The participant may request an accessible copy, subject to privacy and legal obligations. Plan information is guidance only; the participant remains responsible for confirming available funding unless another written arrangement applies.

### 4. MapAble responsibilities

MapAble will:

- provide only agreed supports using workers with appropriate screening, skills, training and supervision;
- treat the participant with dignity, respect and without discrimination;
- take reasonable steps to maintain continuity and give prompt notice of unavoidable service changes;
- follow agreed risk controls and escalate immediate safety concerns; and
- keep service information current enough to support safe handovers and continuity.

### 5. Participant responsibilities

The participant, nominee or authorised representative will:

- provide information reasonably needed to deliver the agreed support safely;
- treat workers and other service users respectfully;
- tell MapAble about relevant changes to support, access or safety needs; and
- give the agreed notice when changing or cancelling a booking where reasonably possible.

### 6. Safety, incidents and continuity

Immediate safety concerns take priority over service delivery. Incidents and suspected abuse, neglect or exploitation will be handled under MapAble's safeguarding procedures and applicable NDIS requirements. If a support is interrupted, MapAble will explain the change and take reasonable steps with the participant to arrange continuity or a safe transition.

### 7. Privacy and information

MapAble will explain what personal information is collected, why it is needed, how it may be used or disclosed, how it is protected and retained, and how to make a privacy complaint. Information will be limited to what is reasonably required and will be used or disclosed only with authority or as permitted by law. The participant may request access to or correction of their information.

### 8. Complaints and disputes

The participant may raise a concern with MapAble in an accessible way, with support from a nominee or advocate if they choose. MapAble will acknowledge the concern, investigate it fairly, explain the outcome and any review option, and will not retaliate or reduce service quality because a complaint was made.

If the issue is not resolved, the participant may use an external complaints or advocacy service, including the NDIS Quality and Safeguards Commission where applicable. Urgent safety issues may be escalated immediately. Nothing in this agreement limits a person's legal rights.

### 9. Changes, ending and acceptance

Any material change must be recorded in a new version for the participant to review and accept. Either party may end the agreement in accordance with the notice terms in the selected modules, except where immediate action is reasonably required for safety, serious breach or legal compliance. MapAble will support an orderly transition where reasonably practicable.

Authenticated acceptance records the participant's agreement to this version. Before accepting, the participant may request more time, an accessible explanation, or support from a nominee, advocate or trusted person.$sla$
),
(
  'module-care-v1',
  'Module A – Care & Support Services',
  'module',
  'care',
  1,
  $sla$## Module A – Care & Support Services

MapAble will roster screened workers with capabilities appropriate to the agreed supports, risk controls and communication needs. MapAble will use reasonable efforts to maintain continuity and will tell the participant promptly if a worker or time must change. The participant should give at least **{{careNoticeHours}} hours' notice** for requested schedule changes and **{{careCancellationHours}} hours' notice** for cancellations. A cancellation fee applies only when agreed in advance and permitted by the current NDIS Pricing Arrangements.

{{variantSections}}$sla$
),
(
  'module-transport-v1',
  'Module B – Transport Services',
  'module',
  'transport',
  1,
  $sla$## Module B – Transport Services

Transport requests should be made at least **{{transportNoticeHours}} hours** before pickup. Cancellations should be made at least **{{transportCancellationHours}} hours** before pickup. Drivers will wait up to **{{transportWaitMinutes}} minutes** unless another arrangement is agreed. The booking must state the pickup, destination, accessibility assistance, price basis and any agreed travel time, toll, parking or cancellation charge before delivery.

{{variantSections}}$sla$
),
(
  'module-employment-v1',
  'Module C – Employment & Job Support Services',
  'module',
  'employment',
  1,
  $sla$## Module C – Employment & Job Support Services

Employment supports will be directed by the participant's goals, strengths and choices and reviewed at least every **{{employmentReviewWeeks}} weeks**. Disability or support information will be shared with an employer only with authority and only to the extent reasonably needed. The participant should give **{{employmentNoticeHours}} hours' notice** when rescheduling a session.

{{variantSections}}$sla$
),
(
  'module-training-v1',
  'Module D – Workforce Development & Training',
  'module',
  'training',
  1,
  $sla$## Module D – Workforce Development & Training

Training dates, learning outcomes, price, materials and accessibility adjustments will be confirmed before delivery. Rescheduling requires **{{trainingNoticeHours}} hours' notice** and cancellation requires **{{trainingCancellationHours}} hours' notice**, unless otherwise agreed. Any reuse or sharing of participant information or training materials must follow the agreed permissions.

{{variantSections}}$sla$
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "sla_variants"
  ("module_id", "variant_id", "name", "default_params")
VALUES
  ('care', 'care-standard', 'Standard Care', '{"careNoticeHours":72,"careCancellationHours":48}'),
  ('care', 'care-priority', 'Priority Care', '{"careNoticeHours":24,"careCancellationHours":24,"careResponseHours":4}'),
  ('care', 'care-complex', 'Specialist / Complex Care', '{"careNoticeHours":168,"careCancellationHours":72}'),
  ('transport', 'transport-standard', 'Standard Transport', '{"transportNoticeHours":24,"transportCancellationHours":12,"transportWaitMinutes":10}'),
  ('transport', 'transport-priority', 'Priority Transport', '{"transportNoticeHours":4,"transportCancellationHours":4,"transportWaitMinutes":10}'),
  ('transport', 'transport-accessible', 'Accessible / Specialist Transport', '{"transportNoticeHours":48,"transportCancellationHours":24,"transportWaitMinutes":15}'),
  ('employment', 'employment-readiness', 'Employment Readiness', '{"employmentNoticeHours":24,"employmentReviewWeeks":6}'),
  ('employment', 'employment-onjob', 'On-the-job Support', '{"employmentNoticeHours":24,"employmentReviewWeeks":4}'),
  ('employment', 'employment-employer', 'Employer Support', '{"employmentNoticeHours":48,"employmentReviewWeeks":8}'),
  ('training', 'training-standard', 'Standard Training', '{"trainingNoticeHours":48,"trainingCancellationHours":48}'),
  ('training', 'training-custom', 'Custom Training', '{"trainingNoticeHours":168,"trainingCancellationHours":72}'),
  ('training', 'training-traintrainer', 'Train-the-trainer', '{"trainingNoticeHours":336,"trainingCancellationHours":168}')
ON CONFLICT ("variant_id") DO NOTHING;
