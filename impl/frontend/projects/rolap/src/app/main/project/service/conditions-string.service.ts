import { round } from 'lodash';

import { environment } from '../../../../../src/environments/environment';

//TODO: duplicated types
interface BaseCondition {
  type: 'elementary_numerical' | 'elementary_nominal' | 'compound' | 'nominal_attributes_equality';
}

interface CompoundCondition extends BaseCondition {
  operator: 'CONJUNCTION' | 'ALTERNATIVE';
  subconditions: BaseCondition[];
}

interface BaseElementaryCondition extends BaseCondition {
  attributes: number[];
  negated: boolean;
}

interface ElementaryNumericalCondition extends BaseElementaryCondition {
  left: number | null;
  right: number | null;
  left_closed: boolean;
  right_closed: boolean;
}

interface ElementaryNominalCondition extends BaseElementaryCondition {
  value: string[];
}

interface NominalAttributesEqualityCondition extends BaseElementaryCondition {
  type: 'nominal_attributes_equality';
}

/**
 * Class for generating string representation for conditions in the format used by the
 * backend.
 */
export class ConditionsStringService {
  /**
   * Generate string representation for given condition in the format used by the
   * backend.
   *
   * @param condition conditions objects in the format used by the backend
   * @param attributesNames array of attribute names (taken from ruleset meta)
   * @returns conditions string, the same as returned by the backend
   */
  public generateConditionsString(condition: BaseCondition, attributesNames: string[]): string {
    return this.internalGenerateCompoundConditionString(condition, attributesNames, true);
  }

  private internalGenerateCompoundConditionString(
    condition: BaseCondition,
    attributesNames: string[],
    isRootCondition: boolean = false,
  ): string {
    try {
      switch (condition.type) {
        case 'elementary_numerical':
          return this.generateNumericalConditionString(condition as ElementaryNumericalCondition, attributesNames);
        case 'elementary_nominal':
          return this.generateNominalConditionString(condition as ElementaryNominalCondition, attributesNames);
        case 'compound':
          return this.generateCompoundConditionString(condition as CompoundCondition, attributesNames, isRootCondition);
        case 'nominal_attributes_equality':
          return this.generateNominalAttributesEqualityString(condition as NominalAttributesEqualityCondition, attributesNames);
        
        default:
          throw new Error(`Unsupported condition type: ${condition.type}`);
      }
    } catch (e) {
      console.error(e);
      throw new Error(`Failed to generate string representation for condition: ${condition}`);
    }
  }

  private generateNumericalConditionString(c: ElementaryNumericalCondition, attributesNames: string[]) {
    // if such conditions attributes fields is always single element array
    const attribute: string = attributesNames[c.attributes[0]];
    let value: string;
    let sign: string;
    // both boundaries are set
    if (c.left !== null && c.right !== null) {
      const leftSign = c.left_closed ? '<' : '(';
      const rightSign = c.right_closed ? '>' : ')';
      return [
        `${attribute} ${c.negated ? '!' : ''}=`,
        `${leftSign}${round(c.left!, environment.rules.numbersDecimalPlaces)}`,
        `${round(c.right!, environment.rules.numbersDecimalPlaces)}${rightSign}`,
      ].join();
    }
    // only right boundary is set, left is -infinity
    if (c.left === null) {
      value = `${round(c.right!, environment.rules.numbersDecimalPlaces)}`;
      if (c.negated) {
        sign = c.right_closed ? '<' : '>=';
      } else {
        sign = c.right_closed ? '<=' : '<';
      }
    } else {
      // only left boundary is set, right is +infinity
      value = `${round(c.left!, environment.rules.numbersDecimalPlaces)}`;
      if (c.negated) {
        sign = c.left_closed ? '<' : '>=';
      } else {
        sign = c.left_closed ? '>=' : '>';
      }
    }
    return `${attribute} ${sign} ${value}`;
  }

  private generateNominalConditionString(c: ElementaryNominalCondition, attributesNames: string[]) {
    // if such conditions attributes fields is always single element array
    const attribute: string = attributesNames[c.attributes[0]];
    return `${attribute} ${c.negated ? '!' : ''}= {${c.value}}`;
  }

  private generateCompoundConditionString(
    condition: CompoundCondition,
    attributesNames: string[],
    isRootCondition: boolean,
  ) {
    const res = condition.subconditions
      .map((s) => this.generateConditionsString(s, attributesNames))
      .join(condition.operator === 'CONJUNCTION' ? ' AND ' : ' OR ');
    if (!isRootCondition) {
      return `(${res})`;
    }
    return res;
  }

  private generateNominalAttributesEqualityString(c: NominalAttributesEqualityCondition, attributesNames: string[]): string {
    if (!c.attributes || c.attributes.length < 2) {
        throw new Error('NominalAttributesEqualityCondition requires two attributes.');
    }
    const firstAttributeName = attributesNames[c.attributes[0]];
    const secondAttributeName = attributesNames[c.attributes[1]];
    const operator = c.negated ? '!=' : '=';
    return `${firstAttributeName} ${operator} ${secondAttributeName}`;
  }
}
