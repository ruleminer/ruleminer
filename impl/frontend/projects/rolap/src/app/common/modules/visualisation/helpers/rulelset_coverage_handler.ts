import * as lodash from 'lodash';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';
import { ClassificationMeta } from 'projects/rolap/src/app/main/project/models/ruleset';

import { V2RulesTableMeta } from '../../../store/v2RulesTable/types';

export class RulesetCoverageHandler {
  public static prepareCoverageRules(rulesToParse: any[]) {
    const rules = lodash.cloneDeep(rulesToParse.filter((rule) => rule.checked));

    rules.forEach((rule: { premise: { subconditions: any[] }; uuid: string }, index: any) => {
      rule.premise.subconditions = rule.premise.subconditions.filter((subcondition) => subcondition.checked);
      rule.premise.subconditions.forEach((subcondition) => {
        subcondition.rule_uuid = rule.uuid;
      });
    });

    const conditions = rules
      .reduce((acc, rule) => acc.concat(rule.premise.subconditions), [])
      .filter((subcondition: any) => {
        return !subcondition.coverage_importance;
      })
      .map((subcondition: any) => [subcondition]);

    return {
      rules,
      conditions,
    };
  }

  private static prepareCoverageData(data: any, problemType: string): any {
    switch (problemType) {
      case ProblemTypes.Regression:
        return `${data.covered_y_mean} ± ${data.covered_y_std}`;
      case ProblemTypes.Survival:
        return `${data.median_survival_time}`;
      default:
        return JSON.stringify(Object.values(data));
    }
  }

  public static setCoverages(rules: any[], data: any[], problemType: string, coverageData: any[]) {
    data.shift();
    let counter = 0;
    rules.forEach((rule, index: number) => {
      rule.premise.subconditions.forEach(
        (subcondition: { coverage_importance: any; text: string }, subIndex: number) => {
          if (coverageData[subIndex] != null && typeof coverageData[subIndex] === 'object') {
            if (coverageData[counter] != null && typeof coverageData[counter] === 'object') {
              subcondition.coverage_importance = this.prepareCoverageData(coverageData[counter], problemType);
            } else {
              subcondition.coverage_importance = null;
            }
            counter++;
          }
        },
      );
    });
  }

  private static prepareCoverageTableForClassification(data: any, meta: ClassificationMeta, problemType: ProblemTypes) {
    const records: {
      class_name: string;
      coverage_count: any;
      all_count: string;
      precision: string;
      coverage: string;
    }[] = []; // not all problems has base row
    let all_n = 0;
    Object.keys(data).forEach((key) => {
      all_n += data[key];
    });

    Object.keys(data).map((key) => {
      const p = data[key];
      const P = meta.decision_attribute_distribution[key];
      const n = all_n - p;
      records.push({
        class_name: key,
        coverage_count: data[key],
        all_count: `${P}`,
        precision: `${(Math.round((p / (p + n)) * 1000) / 1000).toFixed(3)}`,
        coverage: `${(Math.round((p / P) * 1000) / 1000).toFixed(3)}`,
      });
    });
    return records;
  }

  public static prepareCoverageTable(
    data: any,
    meta: V2RulesTableMeta,
    problemType: ProblemTypes,
  ): { [columnName: string]: any }[] {
    data = { ...data[0] };
    switch (problemType) {
      case ProblemTypes.Classification:
        return this.prepareCoverageTableForClassification(data, meta as ClassificationMeta, problemType);
      case ProblemTypes.Regression:
        return [data];
      case ProblemTypes.Survival:
        return [data];
    }
  }

  public static parseRules(rule: any, index: number) {
    const descriptionList = rule.string
      .replace('IF ', '')
      .split('THEN')[0]
      .split('AND')
      .map((el: string) => el.trim());

    rule.index = index;
    rule.premise.subconditions = rule.premise.subconditions.map(
      (el: { text: any; checked: boolean; index: string | number }, index: string | number) => {
        return {
          ...el,
          text: descriptionList[index],
          checked: el.checked ?? false,
          index: index,
        };
      },
    );

    return rule;
  }

  public static filterRules(rule: any, rules: any[]) {
    const correspondingRule = rules.find((r) => r.uuid == rule.uuid);
    if (!!correspondingRule && correspondingRule.string != rule.string) {
      correspondingRule.string = rule.string;

      const premise = lodash.cloneDeep(rule.premise);

      premise.subconditions.forEach((subcondition: any, index: any) => {
        const counterPart = correspondingRule.premise.subconditions[index];
        if (!!counterPart) {
          subcondition.checked = counterPart.checked;
        } else {
          subcondition.checked = false;
        }
      });
      correspondingRule.premise = premise;
      return false;
    }

    return !correspondingRule;
  }
}
