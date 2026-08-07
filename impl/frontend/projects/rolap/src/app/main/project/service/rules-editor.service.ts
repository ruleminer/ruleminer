import { Injectable } from '@angular/core';

import { FilterFieldWithId } from '../../../common/filter-builder/components/filter-builder-container/filter-builder-container.component';
import { FilterDataType, FilterOperator } from '../../../common/filter-builder/filter-builder.types';
import { ProblemTypes } from '../../data-upload/utils/enums';
import { DatasetAttribute, DatasetAttributesRoles, DatasetAttributesTypes } from '../dataset/models/dataset';
import { ClassificationConclusionValue } from '../project-rules/project-rules-table/project-rules-table-editor/rules-editor-side-column/rule-conclusion-editor/classification/classification-rule-conclusion-editor.component';
import { RegressionConclusionValue } from '../project-rules/project-rules-table/project-rules-table-editor/rules-editor-side-column/rule-conclusion-editor/regression/models/conclusion';
import { BaseConclusion } from '../project-rules/project-rules-table/project-rules-table-editor/rules-editor-side-column/rule-conclusion-editor/rule-conclusion-editor.component';
import {
  ConditionGroup,
  NominalAttributes,
  Operator,
  RulesEditorDisplayTypes,
  Subcondition,
} from '../project-rules/project-rules-table/project-rules-table-editor/types/rules-editor';
import { DatasetAttributesInfo } from './models/utils';

export interface RulesDiff {
  removedIndicesFromOld: number[];
  addedIndicesInNew: number[];
}

@Injectable({
  providedIn: 'root',
})
export class RulesEditorService {
  private readonly CONCLUSION_NUMBERS_DECIMAL_PLACES = 2;

  private formatBoundaryValueForConditionString(value: string | number | null | undefined): string {
    if (value == null) {
      return '';
    }
    const num = Number.parseFloat(String(value));
    if (!Number.isFinite(num)) {
      return String(value);
    }
    return String(num);
  }

  /**
   * Formats a numerical value for the rule string, typically to two decimal places.
   */
  private _formatNumericalValueForRuleString(value: number | null | undefined): string {
    if (value == null) return '';
    const num = Number.parseFloat(String(value));
    if (!Number.isFinite(num)) return String(value);
    return num.toFixed(2); // e.g., 5.50
  }

  /**
   * Converts an elementary nominal subcondition to its string representation.
   * Example: "attributeName = {value}"
   */
  private _convertElementaryNominalToString(subcondition: Subcondition, attributeName: string): string {
    const operator = subcondition.negated ? '!=' : '=';
    return `${attributeName} ${operator} {${subcondition.value}}`;
  }

  /**
   * Converts an elementary numerical subcondition to its string representation.
   * Example: "attributeName >= 5.50"
   */
  private _convertElementaryNumericalToString(subcondition: Subcondition, attributeName: string): string {
    if (subcondition.left !== null && subcondition.right === null) {
      const valueStr = this._formatNumericalValueForRuleString(subcondition.left);
      let op: string;
      if (subcondition.negated) {
        op = subcondition.left_closed ? '<' : '<=';
      } else {
        op = subcondition.left_closed ? '>=' : '>';
      }
      return `${attributeName} ${op} ${valueStr}`;
    } else if (subcondition.right !== null && subcondition.left === null) {
      const valueStr = this._formatNumericalValueForRuleString(subcondition.right);
      let op: string;
      if (subcondition.negated) {
        op = subcondition.right_closed ? '>' : '>=';
      } else {
        op = subcondition.right_closed ? '<=' : '<';
      }
      return `${attributeName} ${op} ${valueStr}`;
    } else if (subcondition.left !== null && subcondition.right !== null) {
      const leftNum = Number(subcondition.left);
      const rightNum = Number(subcondition.right);
      if (
        Number.isFinite(leftNum) &&
        Number.isFinite(rightNum) &&
        leftNum === rightNum &&
        subcondition.left_closed &&
        subcondition.right_closed
      ) {
        const valueStr = this._formatNumericalValueForRuleString(subcondition.left);
        const op = subcondition.negated ? '!=' : '=';
        return `${attributeName} ${op} ${valueStr}`;
      } else {
        const leftValStr = this._formatNumericalValueForRuleString(subcondition.left);
        const rightValStr = this._formatNumericalValueForRuleString(subcondition.right);
        const leftBracket = subcondition.left_closed ? '<' : '(';
        const rightBracket = subcondition.right_closed ? '>' : ')';
        const rangeStr = `${attributeName} = ${leftBracket}${leftValStr}, ${rightValStr}${rightBracket}`;
        return subcondition.negated ? `NOT (${rangeStr})` : rangeStr;
      }
    } else if (subcondition.value !== null && subcondition.value !== undefined) {
      const valueStr = this._formatNumericalValueForRuleString((subcondition as any).value as number);
      const op = subcondition.negated ? '!=' : '=';
      return `${attributeName} ${op} ${valueStr}`;
    }

    console.warn('Invalid elementary_numerical subcondition structure:', subcondition);
    return `[InvalidNumerical_${attributeName}]`;
  }
  /**
   * Recursively converts a single subcondition (elementary or compound) to its human-readable string.
   */
  private _convertSubconditionToHumanReadableString(subcondition: Subcondition, attributeNames: string[], allAttributes: DatasetAttribute[]): string {
    if (subcondition.type === 'compound') {
      if (!subcondition.subconditions || subcondition.subconditions.length === 0) {
        return '';
      }
      const operator: Operator = (subcondition as any).operator || 'CONJUNCTION';
      const logicalJoinOperator = operator === 'CONJUNCTION' ? 'AND' : 'OR';

      const subStrings = subcondition.subconditions
        .map((sub) => this._convertSubconditionToHumanReadableString(sub, attributeNames, allAttributes))
        .filter((s) => s && s.trim() !== '');

      if (subStrings.length === 0) return '';

      let result = subStrings.join(` ${logicalJoinOperator} `);

      if (subStrings.length > 1) {
        result = `(${result})`;
      }

      return subcondition.negated ? `NOT ${result}` : result;
    } else if (subcondition.type === 'elementary_nominal' || subcondition.type === 'elementary_numerical') {
      if (!subcondition.attributes || subcondition.attributes.length === 0) {
        console.warn('Subcondition missing attributes:', subcondition);
        return '[MissingAttributeID]';
      }
      const attributeId = subcondition.attributes[0];
      const attributeName = attributeNames[attributeId];

      if (attributeName === undefined) {
        console.warn(`Attribute name not found for ID ${attributeId}. attributeNames length: ${attributeNames.length}`);
        return `[UnknownAttribute_${attributeId}]`;
      }

      if (subcondition.type === 'elementary_nominal') {
        return this._convertElementaryNominalToString(subcondition, attributeName);
      } else {
        return this._convertElementaryNumericalToString(subcondition, attributeName);
      }
    } else if ((subcondition as any).type === 'attributes' || (subcondition as any).type === 'nominal_attributes_equality') {
      if (!subcondition.attributes || subcondition.attributes.length < 2) {
        console.warn('Attribute comparison subcondition missing attributes:', subcondition);
        return '[MissingAttributeIDs]';
      }
      //TODO: id is not an index use allAttributes to get the attribute names
      const [firstAttrId, secondAttrId] = subcondition.attributes as [number, number];
      const firstAttrName = attributeNames[firstAttrId];
      const secondAttrName = attributeNames[secondAttrId];

      if (firstAttrName === undefined || secondAttrName === undefined) {
        console.warn(`Attribute name not found for IDs ${firstAttrId}, ${secondAttrId}`);
        return `[UnknownAttributes_${firstAttrId},${secondAttrId}]`;
      }

      if ((subcondition as any).type === 'attributes') {
        const sub = subcondition as any;
        let operator = sub.operator || '=';
        if (sub.negated) {
          const negationMap: Record<string, string> = {
            '=': '!=',
            '!=': '=',
            '>': '<=',
            '>=': '<',
            '<': '>=',
            '<=': '>',
          };
          operator = negationMap[operator] || operator;
        }
        return `${firstAttrName} ${operator} ${secondAttrName}`;
      } else {
        const operator = subcondition.negated ? '!=' : '=';
        return `${firstAttrName} ${operator} ${secondAttrName}`;
      }
    }
    console.warn('Unknown subcondition type or invalid structure:', subcondition);
    return '[UnknownSubconditionType]';
  }

  /**
   * Generates the complete "IF" part string from a list of subconditions.
   */
  private _generateIfPartString(rootSubconditions: Subcondition[], attributeNames: string[], allAttributes: DatasetAttribute[]): string {
    if (!rootSubconditions || rootSubconditions.length === 0) {
      return '*';
    }

    let operatorForRootList: Operator = 'CONJUNCTION';
    let conditionsToProcess = rootSubconditions;

    if (rootSubconditions.length === 1 && rootSubconditions[0].type === 'compound') {
      const singleCompoundRoot = rootSubconditions[0] as any;
      operatorForRootList = singleCompoundRoot.operator || 'CONJUNCTION';
      conditionsToProcess = singleCompoundRoot.subconditions || [];
      if (singleCompoundRoot.negated) {
        const nestedConditionsString = this._generateIfPartString(conditionsToProcess, attributeNames, allAttributes);
        return nestedConditionsString === '*' ? '*' : `NOT (${nestedConditionsString})`;
      }
    }

    if (conditionsToProcess.length === 0) return '*';
    const logicalJoinOperator = operatorForRootList === 'CONJUNCTION' ? 'AND' : 'OR';

    const conditionStrings = conditionsToProcess
      .map((sub) => this._convertSubconditionToHumanReadableString(sub, attributeNames, allAttributes))
      .filter((s) => s && s.trim() !== '');

    if (conditionStrings.length === 0) {
      return '*';
    }
    return conditionStrings.join(` ${logicalJoinOperator} `);
  }

  public createRuleString(
    problemType: ProblemTypes,
    subconditions: Subcondition[],
    attributeNames: string[],
    conclusion: BaseConclusion,
    decisionAttribute: string | null,
    allAttributes: DatasetAttribute[],
  ): string {
    const conditionString = this._generateIfPartString(subconditions, attributeNames, allAttributes);

    const effectiveDecisionAttribute = decisionAttribute || 'Result';
    const thenPartString = this.generateConclusionStringInternal(conclusion, effectiveDecisionAttribute, problemType);

    if (conditionString && conditionString !== '*') {
      return `IF ${conditionString} THEN ${thenPartString}`;
    } else {
      return `IF * THEN ${thenPartString}`;
    }
  }

  public createRuleObject(uuid: string, subconditions: Subcondition[], conclusion: any, attributeNames: string[]): any {
    const ruleObject = {
      string: '',
      uuid,
      premise: subconditions,
      conclusion,
    };

    return ruleObject;
  }

  /**
   * Create a string representation of a rule conclusion based on problem type
   */
  private generateConclusionStringInternal(
    conclusion: BaseConclusion,
    decisionAttribute: string,
    problemType: ProblemTypes,
  ): string {
    if (!conclusion) {
      return `${decisionAttribute} = ?`;
    }

    switch (problemType) {
      case ProblemTypes.Classification:
        return this.generateClassificationConclusionString(
          conclusion as ClassificationConclusionValue,
          decisionAttribute,
        );
      case ProblemTypes.Regression:
        return this.generateRegressionConclusionString(conclusion as RegressionConclusionValue, decisionAttribute);
      case ProblemTypes.Survival:
        return this.generateSurvivalConclusionString(conclusion as any, decisionAttribute);
      default:
        console.error(`Unsupported problem type: "${problemType}"`);
        return `${decisionAttribute} = ?UNKNOWN_PROBLEM_TYPE?`;
    }
  }

  /**
   * Create a string representation of a classification conclusion
   */
  private generateClassificationConclusionString(
    conclusion: ClassificationConclusionValue,
    decisionAttribute: string,
  ): string {
    if (!conclusion || conclusion.value == null) {
      return `${decisionAttribute} = ?`;
    }
    return `${decisionAttribute} = ${conclusion.value}`;
  }

  /**
   * Create a string representation of a regression conclusion
   */
  private generateRegressionConclusionString(conclusion: RegressionConclusionValue, decisionAttribute: string): string {
    if (!conclusion || conclusion.value == null) {
      return `${decisionAttribute} = ?`;
    }

    let valueString = String(conclusion.value);
    if (typeof conclusion.value === 'number') {
      valueString = conclusion.value.toFixed(this.CONCLUSION_NUMBERS_DECIMAL_PLACES);
    }

    const lowString = conclusion.low != null ? conclusion.low.toFixed(this.CONCLUSION_NUMBERS_DECIMAL_PLACES) : '?';
    const highString = conclusion.high != null ? conclusion.high.toFixed(this.CONCLUSION_NUMBERS_DECIMAL_PLACES) : '?';

    return `${decisionAttribute} = {${valueString}} [${lowString}, ${highString}]`;
  }

  private generateSurvivalConclusionString(conclusion: any, decisionAttribute: string): string {
    if (!conclusion) {
      return `${decisionAttribute} = ?`;
    }
    const conclusionObject = Array.isArray(conclusion) ? conclusion[0] : conclusion;

    let medianSurvivalTime = conclusionObject?.median_survival_time_ci_lower;
    if (medianSurvivalTime == null) {
      return `${decisionAttribute} = ?`;
    }

    if (typeof medianSurvivalTime === 'number') {
      medianSurvivalTime = medianSurvivalTime.toFixed(this.CONCLUSION_NUMBERS_DECIMAL_PLACES);
    }
    return `${decisionAttribute} = {${medianSurvivalTime}}`;
  }

  public generateConditionString(subconditions: Subcondition[] | null): string {
    if (!subconditions || !Array.isArray(subconditions) || subconditions.length === 0) {
      return '*';
    }

    if (subconditions.length === 1 && subconditions[0].type === 'compound' && subconditions[0].subconditions) {
      const compoundSub = subconditions[0];
      const operator =
        compoundSub.type === 'compound' && typeof (compoundSub as any).operator === 'string'
          ? ((compoundSub as any).operator as Operator)
          : 'CONJUNCTION';

      return this.processSubconditions(compoundSub.subconditions || [], operator);
    }
    return this.processSubconditions(subconditions);
  }

  private processSubconditions(subconditions: Subcondition[], operator: Operator = 'CONJUNCTION'): string {
    if (!subconditions || subconditions.length === 0) {
      return '';
    }

    const joinOperator = operator === 'CONJUNCTION' ? ' AND ' : ' OR ';

    const result = subconditions
      .map((subcondition) => this.subconditionToExpression(subcondition))
      .filter((expr) => expr)
      .join(joinOperator);
    return subconditions.length > 1 ? `(${result})` : result;
  }

  private subconditionToExpression(subcondition: Subcondition): string {
    if (!subcondition) {
      return '';
    }

    if (subcondition.type === 'compound' && subcondition.subconditions) {
      const operator =
        typeof (subcondition as any).operator === 'string'
          ? ((subcondition as any).operator as Operator)
          : 'CONJUNCTION';
      const result = this.processSubconditions(subcondition.subconditions, operator);
      return subcondition.negated ? `NOT (${result})` : result;
    }

    if (subcondition.type === 'elementary_nominal' || subcondition.type === 'elementary_numerical') {
      const attributeId =
        subcondition.attributes && subcondition.attributes.length > 0 ? subcondition.attributes[0] : null;
      if (attributeId === null) return '';

      if (subcondition.type === 'elementary_nominal' && subcondition.value !== undefined) {
        const operatorSym = subcondition.negated ? '<>' : '=';
        return `[${attributeId}, ${operatorSym}, "${subcondition.value}"]`;
      }

      if (subcondition.type === 'elementary_numerical') {
        if (subcondition.left !== null && subcondition.right !== null) {
          const leftBracket = subcondition.left_closed ? '[' : '(';
          const rightBracket = subcondition.right_closed ? ']' : ')';
          const baseExpr = `[${attributeId}, between, ${leftBracket}${this.formatBoundaryValueForConditionString(
            subcondition.left,
          )}, ${this.formatBoundaryValueForConditionString(subcondition.right)}${rightBracket}]`;
          return subcondition.negated ? `NOT (${baseExpr})` : baseExpr;
        } else if (subcondition.left !== null) {
          const op = subcondition.left_closed ? '>=' : '>';
          const negOp = subcondition.left_closed ? '<' : '<=';
          return `[${attributeId}, ${subcondition.negated ? negOp : op}, ${this.formatBoundaryValueForConditionString(
            subcondition.left,
          )}]`;
        } else if (subcondition.right !== null) {
          const op = subcondition.right_closed ? '<=' : '<';
          const negOp = subcondition.right_closed ? '>' : '>=';
          return `[${attributeId}, ${subcondition.negated ? negOp : op}, ${this.formatBoundaryValueForConditionString(
            subcondition.right,
          )}]`;
        }
      }
    } else if ((subcondition as any).type === 'attributes' || (subcondition as any).type === 'nominal_attributes_equality') {
      const [firstAttrId, secondAttrId] = subcondition.attributes || [];
      if (firstAttrId === null || firstAttrId === undefined || secondAttrId === null || secondAttrId === undefined) {
        return '';
      }

      if ((subcondition as any).type === 'attributes') {
        const sub = subcondition as any;
        const operator = sub.operator || '=';
        const expressionOperator = this.mapBackendOperatorToExpressionOperator(operator, sub.negated);
        return `[${firstAttrId}, ${expressionOperator}, ${secondAttrId}]`;
      } else {
        const expressionOperator = subcondition.negated ? '<> attribute' : '= attribute';
        return `[${firstAttrId}, ${expressionOperator}, ${secondAttrId}]`;
      }
    }
    return '';
  }

  private mapBackendOperatorToExpressionOperator(backendOp: string, negated: boolean): string {
    if (negated) {
        const negationMap: Record<string, string> = {
            '=': '<> attribute',
            '!=': '= attribute',
            '<>': '= attribute',
            '>': '<= attribute',
            '>=': '< attribute',
            '<': '>= attribute',
            '<=': '> attribute'
        };
        return negationMap[backendOp] || backendOp;
    }

    const mapping: Record<string, string> = {
      '=': '= attribute',
      '!=': '<> attribute',
      '<>': '<> attribute',
      '>': '> attribute',
      '>=': '>= attribute',
      '<': '< attribute',
      '<=': '<= attribute',
    };
    return mapping[backendOp] || backendOp;
  }


  private conditionGroupToExpressionRecursive(conditionGroup: ConditionGroup): string {
    if (!conditionGroup || !Array.isArray(conditionGroup) || conditionGroup.length === 0) {
      return '';
    }
    const result = conditionGroup
      .map((subItem) => {
        if (typeof subItem === 'string') {
          return ` ${subItem.toUpperCase()} `;
        } else if (
          Array.isArray(subItem) &&
          (typeof subItem[0] === 'number' || typeof subItem[0] === 'string') &&
          typeof subItem[1] === 'string'
        ) {
          return this.singleConditionToExpression(subItem as [string | number, string, any]);
        } else if (Array.isArray(subItem)) {
          return this.conditionGroupToExpressionRecursive(subItem as ConditionGroup);
        }
        console.warn('Skipping invalid sub-item in condition group:', subItem);
        return '';
      })
      .filter((str) => str)
      .join('');
    return `(${result.trim()})`;
  }

  private singleConditionToExpression(condition: [string | number, string, any]): string {
    if (!condition || !Array.isArray(condition) || condition.length < 2 || condition.length > 3) {
      console.warn('Invalid single condition format:', condition);
      return '';
    }

    const property = String(condition[0] ?? '');
    const operator = String(condition[1] ?? '').toLowerCase();
    const value = condition.length === 3 ? condition[2] : undefined;

    switch (operator) {
      case '=':
        return `${property} = {${value}}`;
      case '<>':
      case '!=':
        return `${property} \u2260 {${value}}`;
      case '<':
      case '>':
      case '<=':
      case '>=':
        return `${property} ${operator} ${this.formatBoundaryValueForConditionString(value as string | number)}`;
      case 'between':
        if (Array.isArray(value) && value.length >= 2) {
          const val0 = this.formatBoundaryValueForConditionString(value[0]);
          const val1 = this.formatBoundaryValueForConditionString(value[1]);
          return `${property} = <${val0 ?? ''}, ${val1 ?? ''})`;
        }
        console.warn(`Invalid 'between' operator value for property "${property}":`, value);
        return `${property} between ?INVALID_VALUE?`;
      default:
        console.warn(`Unknown operator "${operator}" for property "${property}".`);
        return `${property} ${operator} ${value}`;
    }
  }

  private collectAttributeIndicesFromSubconditions(subconditions: Subcondition[]): number[] {
    if (!subconditions || !Array.isArray(subconditions)) {
      return [];
    }
    const indices = new Set<number>();
    subconditions.forEach((sub) => {
      if (sub.attributes) {
        sub.attributes.forEach((idx) => {
          if (typeof idx === 'number') indices.add(idx);
        });
      }
      if (sub.type === 'compound' && sub.subconditions) {
        const nestedIndices = this.collectAttributeIndicesFromSubconditions(sub.subconditions);
        nestedIndices.forEach((idx) => indices.add(idx));
      }
    });
    return Array.from(indices);
  }

  public updateSubconditionAttributes(
    inputData: Subcondition | Subcondition[],
    newAttributesConfig: DatasetAttribute[],
  ): Subcondition[] {
    if (!inputData) {
      return [];
    }

    const rootArray: Subcondition[] = Array.isArray(inputData) ? inputData : [inputData];

    function updateAttributesRecursively(
      subconditions: Subcondition[],
      attributesConfig: DatasetAttribute[],
    ): Subcondition[] {
      return subconditions.map((originalSub: Subcondition) => {
        const clonedSub: Subcondition = { ...originalSub };

        if (clonedSub.type === 'compound') {
          if (Array.isArray(clonedSub.subconditions) && clonedSub.subconditions.length > 0) {
            clonedSub.subconditions = updateAttributesRecursively(clonedSub.subconditions, attributesConfig);
          } else {
            clonedSub.subconditions = [];
          }
        }
        return clonedSub;
      });
    }

    return updateAttributesRecursively(rootArray, newAttributesConfig);
  }
  private getLookupDataSource(attribute: DatasetAttribute, nominalValueMap: NominalAttributes<string>): string[] | undefined {
    if (nominalValueMap && attribute.name && nominalValueMap[attribute.name]) {
      return nominalValueMap[attribute.name];
    }
    return undefined;
  }

  public getLookupAttrDataSource(attribute: DatasetAttribute, crossReferencedAttributes: NominalAttributes<string>): string[] | undefined {
    if (crossReferencedAttributes && attribute.name && crossReferencedAttributes[attribute.name]) {
      return crossReferencedAttributes[attribute.name];
    }
    return undefined;
  }

  private getFilterOperations(isCategorical: boolean, allowNegation: boolean): string[] {
    const categoricalOpsSource = allowNegation ? ['=', '<>', '= attribute', '<> attribute'] : ['=', '= attribute'];
    const numericalOpsSource = ['<', '>', '<=', '>=', '=', '<>', 'between',
      '< attribute', '> attribute', '<= attribute', '>= attribute', '= attribute', '<> attribute', 'between attribute'
    ];
    const sourceOperations = isCategorical ? categoricalOpsSource : numericalOpsSource;
    const DX_TO_FILTER_OPERATOR_MAP: { [key: string]: FilterOperator } = {
      '=': FilterOperator.Equals,
      '<>': FilterOperator.NotEquals,
      '<': FilterOperator.LessThan,
      '>': FilterOperator.GreaterThan,
      '<=': FilterOperator.LessThanOrEqual,
      '>=': FilterOperator.GreaterThanOrEqual,
      between: FilterOperator.Between,
      '= attribute': FilterOperator.EqualsAttr,
      '<> attribute': FilterOperator.NotEqualsAttr,
      '< attribute': FilterOperator.LessThanAttr,
      '> attribute': FilterOperator.GreaterThanAttr,
      '<= attribute': FilterOperator.LessThanOrEqualAttr,
      '>= attribute': FilterOperator.GreaterThanOrEqualAttr,
      'between attribute': FilterOperator.BetweenAttr,
    };
    return sourceOperations
      .map((op) => DX_TO_FILTER_OPERATOR_MAP[op])
      .filter((op) => op !== undefined) as string[];
  }

  private getFilterDataType(isCategorical: boolean, lookupDataSource: string[] | undefined): FilterDataType {
    if (isCategorical) {
      return lookupDataSource ? FilterDataType.List : FilterDataType.Text;
    } else {
      return FilterDataType.Numeric;
    }
  }

  public initializeFields(
    attributes: DatasetAttribute[],
    nominalValueMap: NominalAttributes<string>,
    crossReferencedAttributes: NominalAttributes<string>,
    displayType: RulesEditorDisplayTypes,
  ): FilterFieldWithId[] {
    if (!attributes || !Array.isArray(attributes)) {
      return [];
    }
    return attributes
      .filter((attr) => attr && attr.name && attr.type)
      .map((attribute, id) => {
        const allowNegation = [
          RulesEditorDisplayTypes.RULE_ADDING_STORE,
          RulesEditorDisplayTypes.RULE_ADDING_BACKEND,
          RulesEditorDisplayTypes.RULE_EDITING,
          RulesEditorDisplayTypes.RULE_EDITING_NOT_COVERED,
        ].includes(displayType);

        const isCategorical = attribute.type === DatasetAttributesTypes.CATEGORICAL;
        const filterOperations = this.getFilterOperations(isCategorical, allowNegation);
        const dataSource = this.getLookupDataSource(attribute, nominalValueMap);
        const attrDataSource = this.getLookupAttrDataSource(attribute, crossReferencedAttributes);
        const dataType = this.getFilterDataType(isCategorical, dataSource);
        const dataField = attribute.name;
        const caption = attribute.name;

        const fieldDefinition: FilterFieldWithId = {
          id,
          dataField,
          caption,
          dataType,
          filterOperations,
          ...(dataSource && attrDataSource ? { lookup: { dataSource, attrDataSource } } :
            dataSource ? { lookup: { dataSource, attrDataSource: [] } } :
              attrDataSource ? { lookup: { dataSource: [], attrDataSource } } :
                {}),
        };
        return fieldDefinition;
      });
  }
  public splitDataByRole(allAttributes: DatasetAttribute[] | null): DatasetAttributesInfo {
    const info: DatasetAttributesInfo = {
      attrs: [],
      classes: null,
      survivalTime: null,
      survivalTimeIndex: null,
    };

    if (!allAttributes) {
      return info;
    }

    allAttributes.forEach((attributeItem, index) => {
      if (!attributeItem || !attributeItem.role) {
        return;
      }
      switch (attributeItem.role) {
        case DatasetAttributesRoles.ATTRIBUTE:
          info.attrs.push(attributeItem);
          break;
        case DatasetAttributesRoles.LABEL:
          info.classes = attributeItem;
          break;
        case DatasetAttributesRoles.SURVIVAL_TIME:
          info.survivalTime = attributeItem;
          info.survivalTimeIndex = index;
          info.attrs.push(attributeItem);
          break;
      }
    });
    return info;
  }
}
