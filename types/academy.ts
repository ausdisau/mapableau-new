export type AcademyCourseSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  estimatedMinutes: number;
  lessonCount: number;
};

export type QuizAnswerSubmission = {
  questionId: string;
  selectedIndex: number;
};
