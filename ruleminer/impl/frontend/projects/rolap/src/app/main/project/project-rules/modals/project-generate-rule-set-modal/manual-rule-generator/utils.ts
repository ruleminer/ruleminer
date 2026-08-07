import { Rule } from '../../../../models/ruleset';

type Condition = {
  attributes: number[];
  subconditions?: Condition[];
};

/**
 * Updates attributes order for given rule. This is needed e.g. when we add a rule from
 * existing ruleset to another ruleset. Lets say we have a dataset with attributes: A, B, C.
 * and we have a second dataset with attributes A, C, B. Rules generated on the first one
 * will refer to C attributes using its index which is 3. But for the second dataset it will be 1.
 * This function allow to update those indices to address this problem.
 *
 * @param rule rule to update
 * @param attributesFromMeta attributes from the parent ruleset meta
 * @param newAttributes new list of attributes specifying their new order
 */
export function updatedAttributesIndicesForRule(
  rule: Rule,
  attributesFromMeta: string[],
  newAttributes: string[],
): void {
  const oldAttributesMap: Record<string, number> = {};
  attributesFromMeta.forEach((attr, index) => {
    oldAttributesMap[attr] = index;
  });
  const oldToNewAttributesMap: Record<number, number> = {};
  newAttributes.forEach((attr, index) => {
    oldToNewAttributesMap[oldAttributesMap[attr]] = index;
  });
  fixAttributesIndicesForCondition(rule.premise as any, oldToNewAttributesMap);
}

function fixAttributesIndicesForCondition(condition: Condition, attributesMap: Record<number, number>): void {
  condition.attributes = condition.attributes?.map((attr) => attributesMap[attr]);
  condition.subconditions?.forEach((subcondition) => {
    fixAttributesIndicesForCondition(subcondition, attributesMap);
  });
}
