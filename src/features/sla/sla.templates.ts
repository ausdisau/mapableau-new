import type {
  SlaModuleDefinition,
  SlaParameters,
  SlaVariantDefinition,
} from "./sla.types";

export interface SlaTemplateSeed {
  key: string;
  name: string;
  type: "core" | "module";
  moduleId: string | null;
  version: number;
  contentMarkdown: string;
}

export const SLA_MODULES: SlaModuleDefinition[] = [
  {
    moduleId: "care",
    name: "Module A – Care & Support Services",
    description: "Personal care, community access and related support services.",
    templateKey: "module-care-v1",
  },
  {
    moduleId: "transport",
    name: "Module B – Transport Services",
    description: "Standard, priority and accessible transport services.",
    templateKey: "module-transport-v1",
  },
  {
    moduleId: "employment",
    name: "Module C – Employment & Job Support Services",
    description: "Employment readiness, on-the-job and employer support.",
    templateKey: "module-employment-v1",
  },
  {
    moduleId: "training",
    name: "Module D – Workforce Development & Training",
    description: "Standard, customised and train-the-trainer programs.",
    templateKey: "module-training-v1",
  },
];

export const SLA_TEMPLATE_SEEDS: SlaTemplateSeed[] = [
  {
    key: "core-terms-v1",
    name: "Core Terms",
    type: "core",
    moduleId: null,
    version: 1,
    contentMarkdown: `# MapAble Service Level Agreement

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

MapAble is not an emergency service. If there is immediate danger or a life-threatening emergency, call \`000\`. Immediate safety concerns take priority over service delivery. Incidents and suspected abuse, neglect or exploitation will be handled under MapAble's safeguarding procedures and applicable NDIS requirements. If a support is interrupted, MapAble will explain the change and take reasonable steps with the participant to arrange continuity or a safe transition.

### 7. Privacy and information

MapAble will explain what personal information is collected, why it is needed, how it may be used or disclosed, how it is protected and retained, and how to make a privacy complaint. Information will be limited to what is reasonably required and will be used or disclosed only with authority or as permitted by law. The participant may request access to or correction of their information.

### 8. Complaints and disputes

The participant may raise a concern with MapAble in an accessible way, with support from a nominee or advocate if they choose. MapAble will acknowledge the concern, investigate it fairly, explain the outcome and any review option, and will not retaliate or reduce service quality because a complaint was made.

If the issue is not resolved, the participant may use an external complaints or advocacy service, including the NDIS Quality and Safeguards Commission where applicable. Urgent safety issues may be escalated immediately. Nothing in this agreement limits a person's legal rights.

### 9. Changes, ending and acceptance

Any material change must be recorded in a new version for the participant to review and accept. Either party may end the agreement in accordance with the notice terms in the selected modules, except where immediate action is reasonably required for safety, serious breach or legal compliance. MapAble will support an orderly transition where reasonably practicable.

Authenticated acceptance records the participant's agreement to this version. Before accepting, the participant may request more time, an accessible explanation, or support from a nominee, advocate or trusted person.
`,
  },
  {
    key: "module-care-v1",
    name: "Module A – Care & Support Services",
    type: "module",
    moduleId: "care",
    version: 1,
    contentMarkdown: `## Module A – Care & Support Services

MapAble will roster screened workers with capabilities appropriate to the agreed supports, risk controls and communication needs. MapAble will use reasonable efforts to maintain continuity and will tell the participant promptly if a worker or time must change. The participant should give at least **{{careNoticeHours}} hours' notice** for requested schedule changes and **{{careCancellationHours}} hours' notice** for cancellations. A cancellation fee applies only when agreed in advance and permitted by the current NDIS Pricing Arrangements.

{{variantSections}}
`,
  },
  {
    key: "module-transport-v1",
    name: "Module B – Transport Services",
    type: "module",
    moduleId: "transport",
    version: 1,
    contentMarkdown: `## Module B – Transport Services

Transport requests should be made at least **{{transportNoticeHours}} hours** before pickup. Cancellations should be made at least **{{transportCancellationHours}} hours** before pickup. Drivers will wait up to **{{transportWaitMinutes}} minutes** unless another arrangement is agreed. The booking must state the pickup, destination, accessibility assistance, price basis and any agreed travel time, toll, parking or cancellation charge before delivery.

{{variantSections}}
`,
  },
  {
    key: "module-employment-v1",
    name: "Module C – Employment & Job Support Services",
    type: "module",
    moduleId: "employment",
    version: 1,
    contentMarkdown: `## Module C – Employment & Job Support Services

Employment supports will be directed by the participant's goals, strengths and choices and reviewed at least every **{{employmentReviewWeeks}} weeks**. Disability or support information will be shared with an employer only with authority and only to the extent reasonably needed. The participant should give **{{employmentNoticeHours}} hours' notice** when rescheduling a session.

{{variantSections}}
`,
  },
  {
    key: "module-training-v1",
    name: "Module D – Workforce Development & Training",
    type: "module",
    moduleId: "training",
    version: 1,
    contentMarkdown: `## Module D – Workforce Development & Training

Training dates, learning outcomes, price, materials and accessibility adjustments will be confirmed before delivery. Rescheduling requires **{{trainingNoticeHours}} hours' notice** and cancellation requires **{{trainingCancellationHours}} hours' notice**, unless otherwise agreed. Any reuse or sharing of participant information or training materials must follow the agreed permissions.

{{variantSections}}
`,
  },
];

function variant(
  moduleId: string,
  variantId: string,
  name: string,
  description: string,
  defaultParams: SlaParameters,
  clauseMarkdown: string,
): SlaVariantDefinition {
  return { moduleId, variantId, name, description, defaultParams, clauseMarkdown };
}

export const SLA_VARIANTS: SlaVariantDefinition[] = [
  variant(
    "care",
    "care-standard",
    "Standard Care",
    "Planned personal care and community support.",
    { careNoticeHours: 72, careCancellationHours: 48 },
    "Planned supports are delivered within the confirmed booking window.",
  ),
  variant(
    "care",
    "care-priority",
    "Priority Care",
    "Time-sensitive care with an expedited response target.",
    { careNoticeHours: 24, careCancellationHours: 24, careResponseHours: 4 },
    "MapAble will acknowledge a priority request within **{{careResponseHours}} hours** and advise whether it can be safely fulfilled.",
  ),
  variant(
    "care",
    "care-complex",
    "Specialist / Complex Care",
    "Complex support delivered by appropriately skilled workers.",
    { careNoticeHours: 168, careCancellationHours: 72 },
    "A current support plan, risk controls and required worker competencies must be confirmed before complex care begins.",
  ),
  variant(
    "transport",
    "transport-standard",
    "Standard Transport",
    "Pre-booked point-to-point transport.",
    { transportNoticeHours: 24, transportCancellationHours: 12, transportWaitMinutes: 10 },
    "The service covers the confirmed pickup, destination and agreed assistance.",
  ),
  variant(
    "transport",
    "transport-priority",
    "Priority Transport",
    "Short-notice transport subject to availability.",
    { transportNoticeHours: 4, transportCancellationHours: 4, transportWaitMinutes: 10 },
    "Priority requests are subject to driver availability; acceptance is confirmed only when a driver is allocated.",
  ),
  variant(
    "transport",
    "transport-accessible",
    "Accessible / Specialist Transport",
    "Transport with specified accessibility equipment or assistance.",
    { transportNoticeHours: 48, transportCancellationHours: 24, transportWaitMinutes: 15 },
    "Vehicle and assistance requirements will be confirmed before dispatch, including mobility-device dimensions and securement needs where relevant.",
  ),
  variant(
    "employment",
    "employment-readiness",
    "Employment Readiness",
    "Goal setting, applications, interviews and workplace preparation.",
    { employmentNoticeHours: 24, employmentReviewWeeks: 6 },
    "Activities may include vocational profiling, applications, interview preparation and workplace-readiness planning.",
  ),
  variant(
    "employment",
    "employment-onjob",
    "On-the-job Support",
    "Support to begin, sustain or develop in employment.",
    { employmentNoticeHours: 24, employmentReviewWeeks: 4 },
    "On-the-job support will be coordinated with the participant and, with consent, the employer, without disclosing unnecessary disability information.",
  ),
  variant(
    "employment",
    "employment-employer",
    "Employer Support",
    "Workplace adjustment and inclusive-employment assistance.",
    { employmentNoticeHours: 48, employmentReviewWeeks: 8 },
    "Employer support may include adjustment advice, role design and inclusive-practice guidance, with the participant's informed consent.",
  ),
  variant(
    "training",
    "training-standard",
    "Standard Training",
    "Published training program with stated learning outcomes.",
    { trainingNoticeHours: 48, trainingCancellationHours: 48 },
    "Standard course materials and reasonable accessibility adjustments are included.",
  ),
  variant(
    "training",
    "training-custom",
    "Custom Training",
    "Training tailored to an agreed workforce or participant need.",
    { trainingNoticeHours: 168, trainingCancellationHours: 72 },
    "Scope, deliverables, participant numbers and acceptance criteria will be confirmed before development begins.",
  ),
  variant(
    "training",
    "training-traintrainer",
    "Train-the-trainer",
    "Facilitator development and reusable delivery materials.",
    { trainingNoticeHours: 336, trainingCancellationHours: 168 },
    "Facilitator competency requirements, permitted reuse of materials and quality-assurance checks will be documented before delivery.",
  ),
];

export const SLA_CORE_TEMPLATE_KEY = "core-terms-v1";

export function getModuleDefinition(moduleId: string): SlaModuleDefinition | undefined {
  return SLA_MODULES.find((module) => module.moduleId === moduleId);
}

export function getVariantDefinition(variantId: string): SlaVariantDefinition | undefined {
  return SLA_VARIANTS.find((variant) => variant.variantId === variantId);
}
