type Skill = {
  id: string;
  label: string;
  description: string | null;
  isEssential: boolean;
};

export function RoleBrief({
  skills,
  instructions,
}: {
  skills: Skill[];
  instructions: string | null;
}) {
  return (
    <section
      className="space-y-4 rounded-xl border p-4"
      aria-labelledby="role-skills"
    >
      <h2 id="role-skills" className="font-heading text-lg font-semibold">
        Skills for this role
      </h2>
      {skills.length === 0 && (
        <p>
          The employer hasn’t listed individual skills. See the role description
          for details.
        </p>
      )}
      {[true, false].map((essential) => {
        const group = skills.filter((skill) => skill.isEssential === essential);
        if (!group.length) return null;
        return (
          <div key={String(essential)}>
            <h3 className="font-semibold">
              {essential
                ? "Skills needed at the start"
                : "Additional skills (optional)"}
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              {group.map((skill) => (
                <li key={skill.id} className="break-words">
                  {skill.label}
                  {skill.description && (
                    <p className="whitespace-pre-line text-sm">
                      {skill.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {instructions && (
        <div>
          <h3 className="font-semibold">
            Application instructions from the employer
          </h3>
          <p className="whitespace-pre-line break-words">{instructions}</p>
        </div>
      )}
    </section>
  );
}
