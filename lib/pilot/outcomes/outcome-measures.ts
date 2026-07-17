export type OutcomeMeasure = {
  key: string;
  value: number;
  unit: string;
};

export function computeOutcomeMeasures(input: {
  enrolled: number;
  exited: number;
  complaints: number;
  averageFeedback: number | null;
}): OutcomeMeasure[] {
  return [
    { key: "enrolled", value: input.enrolled, unit: "count" },
    { key: "exited", value: input.exited, unit: "count" },
    { key: "complaints", value: input.complaints, unit: "count" },
    {
      key: "average_feedback",
      value: input.averageFeedback ?? 0,
      unit: "score",
    },
  ];
}
