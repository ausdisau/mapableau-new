export type PilotLesson = {
  theme: string;
  lesson: string;
  recommendation: string;
};

export function compilePilotLessons(input: {
  findings: string[];
  correctiveActions: string[];
}): PilotLesson[] {
  const lessons: PilotLesson[] = [];
  for (const f of input.findings) {
    lessons.push({
      theme: "finding",
      lesson: f,
      recommendation: "Address before next pilot stage",
    });
  }
  for (const a of input.correctiveActions) {
    lessons.push({
      theme: "corrective_action",
      lesson: a,
      recommendation: "Verify effectiveness post-closure",
    });
  }
  return lessons;
}
