import { isAccessibilityOpsFlagEnabled } from "@/lib/accessibility-ops/feature-flags";
import {
  ensureBaselineAccessibilityRules,
  listAccessibilityRules,
  serializeRule,
} from "@/lib/accessibility-ops/rules/rule-registry-service";

export default async function AccessibilityOpsRulesPage() {
  if (
    !isAccessibilityOpsFlagEnabled("opsEnabled") ||
    !isAccessibilityOpsFlagEnabled("ruleRegistry")
  ) {
    return (
      <p className="text-sm text-muted-foreground">
        Rule registry is disabled.
      </p>
    );
  }

  await ensureBaselineAccessibilityRules();
  const rules = (await listAccessibilityRules()).map(serializeRule);

  return (
    <section aria-labelledby="rules-heading" className="space-y-4">
      <h2 id="rules-heading" className="text-xl font-semibold">
        Accessibility rules
      </h2>
      <p className="text-sm text-muted-foreground">
        Versioned rules with source provenance. A legal mapping does not certify
        compliance. Automated pass is not complete accessibility.
      </p>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Versioned accessibility rules</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3">
              Rule
            </th>
            <th scope="col" className="py-2 pr-3">
              Profile
            </th>
            <th scope="col" className="py-2 pr-3">
              Automation
            </th>
            <th scope="col" className="py-2">
              Default severity
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id} className="border-b border-border/60 align-top">
              <td className="py-2 pr-3">
                <div className="font-medium">{rule.plainLanguageTitle}</div>
                <div className="text-xs text-muted-foreground">{rule.title}</div>
                <div className="font-mono text-xs">{rule.stableKey}</div>
              </td>
              <td className="py-2 pr-3">{rule.profile}</td>
              <td className="py-2 pr-3">{rule.automation}</td>
              <td className="py-2">
                <span className="sr-only">Default severity: </span>
                {rule.severityDefault}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
