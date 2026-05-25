import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedAcademyCourses() {
  const course = await prisma.academyCourse.upsert({
    where: { slug: "ndis-code-of-conduct-intro" },
    create: {
      slug: "ndis-code-of-conduct-intro",
      title: "NDIS Code of Conduct — Introduction",
      summary:
        "Essential conduct standards for workers supporting NDIS participants.",
      description:
        "Learn the core expectations for respectful, safe, and rights-based support.",
      category: "ndis_compliance",
      status: "published",
      estimatedMinutes: 45,
      publishedAt: new Date(),
      lessons: {
        create: [
          {
            title: "Your responsibilities",
            sortOrder: 0,
            contentMarkdown:
              "## Your responsibilities\n\nWorkers must act with respect, integrity, and regard for human rights.",
            videoUrl: null,
          },
          {
            title: "Privacy and information",
            sortOrder: 1,
            contentMarkdown:
              "## Privacy\n\nOnly collect and use participant information for agreed purposes.",
          },
          {
            title: "Reporting concerns",
            sortOrder: 2,
            contentMarkdown:
              "## Reporting\n\nKnow how to report incidents and abuse through your organisation.",
          },
        ],
      },
      quiz: {
        create: {
          title: "Conduct knowledge check",
          passMarkPercent: 80,
          questions: {
            create: [
              {
                questionText: "When should you share participant information?",
                options: [
                  "Whenever a colleague asks",
                  "Only for agreed support purposes",
                  "On social media if anonymised",
                  "Never document anything",
                ],
                correctIndex: 1,
                sortOrder: 0,
              },
              {
                questionText: "What should you do if you witness abuse?",
                options: [
                  "Ignore it if unsure",
                  "Report through safeguarding processes",
                  "Post about it online",
                  "Wait a year to mention it",
                ],
                correctIndex: 1,
                sortOrder: 1,
              },
            ],
          },
        },
      },
    },
    update: {
      status: "published",
      publishedAt: new Date(),
    },
    include: { lessons: true, quiz: true },
  });

  return course;
}

if (require.main === module) {
  seedAcademyCourses()
    .then((c) => console.log("Seeded course:", c.title))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
