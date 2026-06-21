"use client";

import { useEffect, useState } from "react";

type ToolInfo = {
  name: string;
  description: string;
  sensitivity: string;
  requiresHumanApproval?: boolean;
};

export default function AgentToolsPage() {
  const [tools, setTools] = useState<ToolInfo[]>([]);

  useEffect(() => {
    void fetch("/api/mapable-agent/tools")
      .then((r) => r.json())
      .then((data: { tools?: ToolInfo[] }) => setTools(data.tools ?? []));
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Agent tools</h1>
      <p className="mt-2 text-slate-600">
        Tools the agent may call. Sensitive tools always create an audit record.
      </p>
      <ul className="mt-6 space-y-3">
        {tools.map((tool) => (
          <li key={tool.name} className="rounded-xl border border-slate-200 p-4">
            <h2 className="font-mono text-sm font-semibold text-[#005B7F]">{tool.name}</h2>
            <p className="mt-1 text-slate-700">{tool.description}</p>
            <p className="mt-2 text-sm text-slate-500">
              Sensitivity: {tool.sensitivity}
              {tool.requiresHumanApproval ? " · requires human approval" : ""}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
