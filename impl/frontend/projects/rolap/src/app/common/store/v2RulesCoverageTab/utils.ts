import { FilteringRule, VisibleRule } from './types';

export function filterOnlyActiveRules(
  activesRulesUuids: Set<string>,
  rulesToFilter: (VisibleRule | FilteringRule)[],
): VisibleRule[] {
  if (rulesToFilter === null || rulesToFilter === undefined) return rulesToFilter;
  return rulesToFilter.filter((rule) => activesRulesUuids.has(rule.uuid));
}

export function sortRuleByNameAscending(rules: VisibleRule[] | FilteringRule[]): void {
  rules.sort((a, b) => {
    return Number.parseInt(a.ruleName) - Number.parseInt(b.ruleName);
  });
}
