import { StoryCard } from "./StoryCard";

export function StoryLibrary({
  stories,
}: {
  stories: { id: string; title: string; contentWarning?: string | null }[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {stories.map((s) => (
        <li key={s.id}>
          <StoryCard {...s} />
        </li>
      ))}
    </ul>
  );
}
