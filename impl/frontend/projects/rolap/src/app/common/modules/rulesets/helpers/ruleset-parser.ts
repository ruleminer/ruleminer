import { v4 as uuidv4 } from 'uuid';

import { Color } from '../../visualisation/interfaces/colors';

export class RulesetParser {
  constructor(
    private rules: any[],
    private colors: Color[],
    public links: any[] = [],
    public subconditionsMap = new Map(),
    public classificationMap = new Map(),
  ) {}

  public parse(): any {
    this.rules.forEach((rule, index) => {
      if (!this.classificationMap.has(rule.conclusion.value)) {
        this.classificationMap.set(rule.conclusion.value, {
          id: uuidv4(),
          label: rule.conclusion.value,
          type: 'class',
          condition: rule.condition,
        });
      }

      rule.premise.subconditions.forEach((condition: any) => {
        if (!this.subconditionsMap.has(condition.text)) {
          this.subconditionsMap.set(condition.text, {
            id: uuidv4(),
            label: condition.text,
            type: 'condition',
            condition: condition,
          });
        }
      });

      for (let index2 = 1; index2 < rule.premise.subconditions.length; index2++) {
        const sourceCondition = this.subconditionsMap.get(rule.premise.subconditions[index2 - 1].text);
        const targetCondition = this.subconditionsMap.get(rule.premise.subconditions[index2].text);

        if (sourceCondition && targetCondition) {
          this.links.push({
            source: sourceCondition.id,
            target: targetCondition.id,
            color: this.colors[index % this.colors.length].value,
            text: rule.premise.subconditions[index2 - 1].coverage_importance,
          });
        }
      }

      if (rule.premise.subconditions.length >= 1)
        this.links.push({
          source: rule.uuid,
          target: this.subconditionsMap.get(rule.premise.subconditions[0].text).id,
          color: this.colors[index % this.colors.length].value,
        });

      if (rule.premise.subconditions.length >= 1)
        this.links.push({
          source: this.subconditionsMap.get(rule.premise.subconditions[rule.premise.subconditions.length - 1].text).id,
          target: this.classificationMap.get(rule.conclusion.value).id,
          color: this.colors[index % this.colors.length].value,
          text: rule.premise.subconditions[rule.premise.subconditions.length - 1].coverage_importance,
        });

      this.links.forEach((link, i) => {
        const identical = this.links.filter((l) => l.source === link.source && l.target === link.target);
        const index = identical.indexOf(link);
        link.multiLinkIndex = index;
        link.totalLinks = identical.length;
      });

      const uniqueLinks = [];
      const seen: any = {};
      this.links.forEach((link) => {
        const identifier = `${link.source}-${link.target}`;
        if (!seen[identifier]) {
          seen[identifier] = true;
          uniqueLinks.push(link);
          link.showText = true;
          return;
        }
        link.showText = false;
      });
    });
  }
}
