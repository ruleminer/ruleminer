import { detect } from 'detect-browser';
import { groupBy } from 'lodash';

import { Tabs } from '../../../common/store/app-state.model';
import { removeIfAndThenFromRule } from '../../../common/store/ruleSets/rulesets.reducer';
import { Ids } from '../../../common/store/ruleSets/rulesets.selectors';
import { V2RulesTableData, V2RulesTableMeta } from '../../../common/store/v2RulesTable/types';
import { generateNgrxKey } from '../../../common/store/v2Tabs/utils';
import { AlgorithmParams } from '../../project/models/project';
import { EditedRow, NewRow, Rule, Subcondition } from '../../project/models/ruleset';
import { ExpertRule } from '../../project/project-rules/project-rules-table/project-rules-table-editor/types/rules-editor';
import { DataField } from '../../project/service/models/rules-customize-columns-api';
import { FileExtension } from './enums';
import { AvailableFileExtensions } from './types';

export function getColumnsLength(data: any): string[] {
  if (data && data.length > 0) {
    return Object.keys(data[0]);
  }
  return [];
}

export function removeQuotes(data: string): string {
  return data.replace(/['"]/g, '');
}

export function getActiveRows(array: V2RulesTableData, activeRowsUuids: string[]) {
  return array.filter((item) => activeRowsUuids.includes(item.uuid));
}

export function convertRulesBigTableForBackend(bigTable: V2RulesTableData): Array<Rule> {
  return [...bigTable].map((item: any) => convertRulesBigTableRowForBackend(item));
}

/**
 * This function builds a ruleset object for backend use by filtering active rows and converting them into the required format.
 *
 * @param v2RulesTableData - The table data containing the rules information.
 * @param meta - Metadata associated with the rules table.
 * @param activeRowsUuids - Array of UUIDs to identify active rows.
 * @returns A ruleset object containing the converted rules and the metadata.
 */
export function buildRulesetFromActiveRowsForBackend(
  v2RulesTableData: V2RulesTableData,
  meta: V2RulesTableMeta,
  activeRowsUuids: string[],
): { rules: Array<Rule>; meta: V2RulesTableMeta } {
  const activeRows = getActiveRows(v2RulesTableData, activeRowsUuids);
  const rules = convertRulesBigTableForBackend(activeRows);
  return {
    rules,
    meta,
  };
}

export function convertRulesBigTableRowForBackend(bigTableRow: Record<DataField, any> | EditedRow): Rule {
  return {
    uuid: bigTableRow.uuid,
    index: bigTableRow.autoIncrement,
    string: bigTableRow.string,
    premise: bigTableRow.premise,
    conclusion: bigTableRow.conclusion,
  };
}

export function convertRulesBigTableRowForBackendWithLabels(bigTableRow: Record<DataField, any> | EditedRow): Rule {
  return {
    labels: bigTableRow.labels,
    uuid: bigTableRow.uuid,
    string: bigTableRow.string,
    premise: bigTableRow.premise,
    conclusion: bigTableRow.conclusion,
  };
}

export function convertJSONValues(
  jsonData: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> {
  const convertedData: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(jsonData)) {
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      convertedData[key] = parseFloat(value);
    } else {
      convertedData[key] = value;
    }
  }
  return convertedData;
}

export function sortParametersByType(params: AlgorithmParams): AlgorithmParams {
  const order = ['expert_rules', 'expert_conditions', 'expert_attributes', 'input', 'choice', 'int', 'float', 'bool'];

  params.parameters.sort((a, b) => {
    const typeA = a.parameter_type;
    const typeB = b.parameter_type;

    const indexA = order.indexOf(typeA);
    const indexB = order.indexOf(typeB);

    if (indexA < indexB) return -1;
    if (indexA > indexB) return 1;

    return a.name.localeCompare(b.name);
  });

  params.expert_parameters.sort((a, b) => {
    const typeA = a.parameter_type;
    const typeB = b.parameter_type;

    const indexA = order.indexOf(typeA);
    const indexB = order.indexOf(typeB);

    if (indexA < indexB) return -1;
    if (indexA > indexB) return 1;

    return a.name.localeCompare(b.name);
  });

  return params;
}

export function hasSameIds(tab: Tabs, ids: Ids, tabType: string): boolean {
  const ngrxId = generateNgrxKey(ids.projectId, ids.dataSetId, ids.ruleSetId, ids.reportId, tabType);
  return tab.id === ngrxId;
}

const processFilterItem = (filterItem: any) => {
  const processedFilter: Array<[string, any]> = [];
  if (!Array.isArray(filterItem) || filterItem.length < 3) return processedFilter;

  const [attribute, operator, value] = filterItem;

  if (!attribute) return processedFilter;

  let operatorString = '';

  if (typeof operator === 'string' && operator.startsWith('__')) {
    operatorString = operator;
  } else {
    switch (operator) {
      case 'contains':
        operatorString = '__icontains';
        break;
      case '=':
        operatorString = '__eq';
        break;
      case '<>':
        operatorString = '__ne';
        break;
      case '>':
        operatorString = '__gt';
        break;
      case '<':
        operatorString = '__lt';
        break;
      case '>=':
        operatorString = '__ge';
        break;
      case '<=':
        operatorString = '__le';
        break;
      case 'startswith':
        operatorString = '__istartswith';
        break;
      case 'icontains':
        operatorString = '__icontains';
        break;
      case 'eq':
        operatorString = '__eq';
        break;
      case 'istartswith':
        operatorString = '__istartswith';
        break;
      default:
        operatorString = '__icontains';
    }
  }
  if (Array.isArray(value) && value.length === 2) {
    value.forEach((element: string, index: number) => {
      const suffix = index === 0 ? '__ge' : '__le';
      const parameter: [string, any] = [`${attribute}${suffix}`, element];
      processedFilter.push(parameter);
    });
  } else {
    const readyFilter: [string, any] = [`${attribute}${operatorString}`, value];
    processedFilter.push(readyFilter);
  }

  return processedFilter;
};

export const datasetFilterMapper = (expression: any) => {
  const mappedFilters = [];

  const isAnd = expression && typeof expression.includes === 'function' && expression.includes('and');

  if (isAnd) {
    for (const item of expression) {
      if (Array.isArray(item)) {
        const filterItem = processFilterItem(item);
        for (const filter of filterItem) {
          mappedFilters.push(filter);
        }
      }
    }
  } else if (Array.isArray(expression)) {
    const filterItem = processFilterItem(expression);
    for (const filter of filterItem) {
      mappedFilters.push(filter);
    }
  }

  return mappedFilters;
};

export function convertJson(inputJson: Record<DataField, any>): NewRow {
  return {
    ...inputJson,
    uuid: inputJson.uuid,
    string: inputJson.string,
    premise: inputJson.premise,
    conclusion: inputJson.conclusion,
    rule_uuid: inputJson.uuid,
    autoIncrement: 1 as const, //DO NOT CHANGE THIS. V2RulesTableActions.addRowToCurrentTableComplete depends on this value
    displayString: removeIfAndThenFromRule(inputJson.string),
  };
}

export function replaceAttributeValueByIndex(obj: ExpertRule, nameAttr: string[]): ExpertRule {
  const processConditions = (conditions: (Subcondition | any)[], attributeNames: string[]): void => {
    if (!Array.isArray(conditions)) {
      return;
    }

    conditions.forEach((condition) => {
      if (Array.isArray(condition)) {
        processConditions(condition, attributeNames);
      }
      else if (
        condition &&
        (condition.type === 'elementary_numerical' || condition.type === 'elementary_nominal') &&
        condition.attributes
      ) {
        const index = condition.attributes[0];
        if (index >= 0 && index < attributeNames.length) {
          condition.attribute = attributeNames[index];
          delete condition.attributes;
        }
      }
    });
  };

  if (obj?.premise?.subconditions) {
    processConditions(obj.premise.subconditions, nameAttr);
  }

  return obj;
}

export const groupConditions = (conditions: any) => {
  return groupBy(conditions, (condition) => Object.keys(condition)[0]);
};

export const transformConditions = (groupedConditions: { [x: string]: any[] }) => {
  const transformedData: any = {};
  Object.keys(groupedConditions).forEach((key) => {
    transformedData[key] = groupedConditions[key].map((condition) => condition[key].premise);
  });
  return transformedData;
};

export const getCurrentTimestamp = (): number => {
  return new Date().getTime();
};

export const getLocalDateTime = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};

export const isFileCsv = (file: File): boolean => {
  const browser = detect();
  if (browser?.name === 'firefox') return ['text/csv', 'application/vnd.ms-excel'].includes(file.type);
  return file.type === 'text/csv';
};

export const checkFileExtension = (file: File, availableExtensions: AvailableFileExtensions[]): boolean => {
  const browser = detect();

  if (browser?.name === 'firefox' && file.type === 'application/vnd.ms-excel') {
    return availableExtensions.includes(FileExtension.csv);
  }

  const includes = mimeTypesMap.get(file.type);

  if (!includes) return false;

  return availableExtensions.includes(includes);
};

export const getFileName = (content: any) => {
  const filenameRegex = /filename="([^"]+)"/;
  const match = content.match(filenameRegex);
  const filename = match[1];
  return filename;
};

export const mimeTypesMap = new Map([
  ['text/csv', FileExtension.csv],
  ['application/json', FileExtension.json],
  ['text/plain', FileExtension.txt],
]);
