export default function AcademyAccessibilityPage() {
  return (
    <article className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-teal-950">
        Accessibility at MapAble Academy
      </h1>
      <p className="text-slate-700">
        We aim for WCAG 2.2 AA. The course player supports keyboard operation, visible
        focus, landmarks, captions, transcripts, Easy Read variants, and reduced
        motion. Assessments have no time limit by default. Progress saves so you can
        resume later.
      </p>
      <p className="text-slate-700">
        The player never traps focus and does not require drag-and-drop, precise
        pointer movement, colour alone, or audio alone.
      </p>
      <p className="text-sm text-slate-600">
        Adjust spacing and contrast via your MapAble accessibility preferences where
        available.
      </p>
    </article>
  );
}
