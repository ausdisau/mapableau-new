import type { PrismaClient } from "@prisma/client";

/**
 * Seeds the original demonstration course “MapAble Worker Foundations”.
 * Uses fictional examples only. Links to authoritative public sources.
 * Does not copy third-party training content.
 */
export async function seedMapAbleWorkerFoundations(
  prisma: PrismaClient,
  opts?: { publisherUserId?: string },
) {
  const framework = await prisma.competencyFramework.upsert({
    where: { code: "MAPABLE-WORKER-CAPABILITY" },
    create: {
      code: "MAPABLE-WORKER-CAPABILITY",
      title: "MapAble Worker Capability Framework (demonstration)",
      description:
        "MapAble capability levels (Bronze / Silver / Gold) are not AQF qualifications.",
    },
    update: {},
  });

  const competency = await prisma.competency.upsert({
    where: {
      frameworkId_code: {
        frameworkId: framework.id,
        code: "RIGHTS-FOUNDATIONS",
      },
    },
    create: {
      frameworkId: framework.id,
      code: "RIGHTS-FOUNDATIONS",
      title: "Rights-based support foundations",
      description:
        "Demonstrate awareness of participant rights and dignity of risk using fictional scenarios.",
    },
    update: {},
  });

  const course = await prisma.course.upsert({
    where: { slug: "mapable-worker-foundations" },
    create: {
      slug: "mapable-worker-foundations",
      code: "MWF-001",
      title: "MapAble Worker Foundations",
      summary:
        "Demonstration course for disability support workers. Original MapAble content with fictional examples. Not nationally recognised training.",
    },
    update: {
      title: "MapAble Worker Foundations",
      summary:
        "Demonstration course for disability support workers. Original MapAble content with fictional examples. Not nationally recognised training.",
    },
  });

  await prisma.courseCompetency.upsert({
    where: {
      courseId_competencyId: {
        courseId: course.id,
        competencyId: competency.id,
      },
    },
    create: { courseId: course.id, competencyId: competency.id },
    update: {},
  });

  await prisma.practiceStandardMapping.deleteMany({
    where: { courseId: course.id },
  });
  await prisma.practiceStandardMapping.createMany({
    data: [
      {
        courseId: course.id,
        standardCode: "NDIS-COC",
        standardTitle: "NDIS Code of Conduct (public reference)",
        notes:
          "Workers should read the official NDIS Code of Conduct. MapAble Academy does not reproduce Commission training materials.",
      },
      {
        courseId: course.id,
        standardCode: "UNCRPD",
        standardTitle: "UN Convention on the Rights of Persons with Disabilities",
        notes: "Rights-based framing for demonstration only.",
      },
    ],
  });

  let version = await prisma.courseVersion.findFirst({
    where: { courseId: course.id, versionNumber: 1 },
  });

  if (!version) {
    version = await prisma.courseVersion.create({
      data: {
        courseId: course.id,
        versionNumber: 1,
        title: "MapAble Worker Foundations",
        description:
          "Participant-first, rights-based foundations for fictional workforce capability demonstration.",
        status: "draft",
      },
    });
  }

  // Rebuild modules/lessons idempotently for version 1 while draft
  if (version.status !== "published") {
    await prisma.module.deleteMany({ where: { courseVersionId: version.id } });
    await prisma.assessment.deleteMany({ where: { courseVersionId: version.id } });

    const module1 = await prisma.module.create({
      data: {
        courseVersionId: version.id,
        title: "Rights and dignity",
        summary: "What rights-based support means in everyday practice (fictional).",
        sortOrder: 1,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          moduleId: module1.id,
          slug: "welcome",
          title: "Welcome to MapAble Worker Foundations",
          sortOrder: 1,
          estimatedMinutes: 5,
          bodyMarkdown: `## Welcome

This is an **original MapAble Academy demonstration course**. It uses fictional people and places only.

### What this certificate means

Completing this course earns a **Certificate of Completion** from MapAble Academy. It is **not** an AQF qualification, Statement of Attainment, or nationally recognised training outcome. Learning records support workforce capability; they **do not guarantee NDIS compliance**.

### Authoritative public sources (read on the publisher’s site)

- [NDIS Code of Conduct](https://www.ndiscommission.gov.au/workers/ndis-code-conduct)
- [NDIS Practice Standards overview](https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-obligations/ndis-practice-standards)
- [UN CRPD](https://www.un.org/development/desa/disabilities/convention-on-the-rights-of-persons-with-disabilities.html)

Do not treat this page as a substitute for Commission resources.
`,
          easyReadMarkdown: `## Welcome (Easy Read)

This is a **practice course** from MapAble Academy.

It uses **made-up** stories.

When you finish, you get a **Certificate of Completion**.

This is **not** a university or TAFE qualification.

It does **not** mean you are “guaranteed compliant” with the NDIS.
`,
          transcript:
            "Welcome to MapAble Worker Foundations, an original demonstration course. It uses fictional examples only and does not guarantee NDIS compliance.",
          audioDescription:
            "Title card: MapAble Worker Foundations demonstration course. Text explains Certificate of Completion disclaimer.",
        },
        {
          moduleId: module1.id,
          slug: "fictional-scenario-aisha",
          title: "Fictional scenario: supporting Aisha’s choice",
          sortOrder: 2,
          estimatedMinutes: 8,
          bodyMarkdown: `## Fictional scenario

**Aisha** (fictional participant) wants to try a community art class. A fictional worker, **Jordan**, worries that transport might be tiring.

### Rights-based reflection

1. Ask Aisha what *she* wants to achieve.
2. Share information about fatigue and pacing in plain language.
3. Support dignity of risk — do not substitute Jordan’s preference for Aisha’s decision.
4. Document consent for any shared plan notes using your organisation’s consent process.

This scenario is fictional. For legal duties, rely on primary sources such as the NDIS Code of Conduct.
`,
          easyReadMarkdown: `## Story about Aisha (made up)

Aisha wants to go to an art class.

Jordan is a worker. Jordan is worried.

Jordan should:

1. Ask Aisha what she wants.
2. Explain things in plain words.
3. Let Aisha choose.
4. Only share notes if Aisha says yes.
`,
          transcript:
            "Fictional scenario about Aisha choosing an art class and worker Jordan supporting dignity of risk.",
          captionsVtt: `WEBVTT

00:00.000 --> 00:08.000
Fictional scenario: Aisha wants to attend an art class.

00:08.000 --> 00:16.000
Jordan supports Aisha's choice using plain language and consent.
`,
        },
      ],
    });

    const module2 = await prisma.module.create({
      data: {
        courseVersionId: version.id,
        title: "Safe, respectful communication",
        summary: "Communication habits that respect autonomy.",
        sortOrder: 2,
      },
    });

    await prisma.lesson.create({
      data: {
        moduleId: module2.id,
        slug: "communication-basics",
        title: "Communication that centres the participant",
        sortOrder: 1,
        estimatedMinutes: 7,
        bodyMarkdown: `## Communication basics

Use the participant’s preferred name and communication method. Check understanding. Avoid jargon.

### Fictional micro-example

**Sam** (fictional) prefers short written messages. Before changing a visit time, Jordan sends a plain-language SMS and waits for confirmation.

Public reference: follow accessibility and communication guidance from reputable government sources; do not treat this lesson as legal advice.
`,
        easyReadMarkdown: `## Talking and writing with respect

Use the name the person likes.

Use the way they like to talk — speech, text, or other.

Check they understand.

Say things in plain words.
`,
        transcript:
          "Use preferred names and communication methods. Confirm understanding in plain language.",
      },
    });

    const assessment = await prisma.assessment.create({
      data: {
        courseVersionId: version.id,
        title: "Foundations check",
        passingScore: 70,
        timeLimitMinutes: null,
      },
    });

    await prisma.assessmentQuestion.createMany({
      data: [
        {
          assessmentId: assessment.id,
          sortOrder: 1,
          prompt:
            "A MapAble Academy Certificate of Completion means which of the following?",
          optionsJson: [
            "An AQF qualification",
            "A Certificate of Completion that does not guarantee NDIS compliance",
            "A Statement of Attainment",
            "Nationally recognised accredited training",
          ],
          correctIndex: 1,
          explanation:
            "Academy issues Certificates of Completion only. They are not AQF outcomes and do not guarantee compliance.",
        },
        {
          assessmentId: assessment.id,
          sortOrder: 2,
          prompt:
            "In the fictional Aisha scenario, what should Jordan prioritise?",
          optionsJson: [
            "Jordan’s preference that Aisha stays home",
            "Aisha’s informed choice and dignity of risk",
            "Skipping consent because the story is fictional",
            "Copying proprietary third-party training scripts",
          ],
          correctIndex: 1,
          explanation:
            "Rights-based practice centres the participant’s informed choice.",
        },
        {
          assessmentId: assessment.id,
          sortOrder: 3,
          prompt: "Bronze, Silver and Gold in MapAble mean:",
          optionsJson: [
            "AQF levels",
            "MapAble capability levels (not AQF qualifications)",
            "NDIS registration classes",
            "Guaranteed compliant worker grades",
          ],
          correctIndex: 1,
          explanation:
            "Capability levels are MapAble-only signals with an AQF disclaimer.",
        },
      ],
    });
  }

  // Publish demonstration course for catalogue
  const published = await prisma.courseVersion.update({
    where: { id: version.id },
    data: {
      status: "published",
      publishedAt: new Date(),
      publishedById: opts?.publisherUserId,
      isImmutable: true,
      contentHash: `v1:mapable-worker-foundations:demo`,
      title: "MapAble Worker Foundations",
      description:
        "Participant-first, rights-based foundations (demonstration). Certificate of Completion only — not AQF.",
    },
  });

  if (opts?.publisherUserId) {
    const existingReview = await prisma.contentReview.findFirst({
      where: {
        courseVersionId: published.id,
        reviewRole: "disability_led_reviewer",
        decision: "approved",
      },
    });
    if (!existingReview) {
      await prisma.contentReview.create({
        data: {
          courseVersionId: published.id,
          reviewerId: opts.publisherUserId,
          reviewRole: "disability_led_reviewer",
          decision: "approved",
          comments:
            "Demonstration approval for seeded course (fictional reviewer context).",
        },
      });
    }
  }

  const path = await prisma.learningPath.upsert({
    where: { slug: "worker-foundations-path" },
    create: {
      slug: "worker-foundations-path",
      title: "Worker foundations pathway",
      description: "Demonstration pathway containing MapAble Worker Foundations.",
      status: "published",
    },
    update: { status: "published" },
  });

  await prisma.learningPathCourse.upsert({
    where: {
      learningPathId_courseId: {
        learningPathId: path.id,
        courseId: course.id,
      },
    },
    create: {
      learningPathId: path.id,
      courseId: course.id,
      sortOrder: 1,
    },
    update: {},
  });

  return { course, version: published, pathway: path };
}
