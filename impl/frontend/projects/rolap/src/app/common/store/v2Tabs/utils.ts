import { ReportTypeMenuItem } from '../../../main/project/dataset/treeview/types';
import { TinyTabInfo } from '../../interfaces/tab.model';
import { TabType } from '../app-state.model';
import { V2Tab } from './types';

export const generateNgrxKey = (
  projectId: number | null | undefined,
  dataSetId: number | null | undefined,
  ruleSetId: number | null | undefined,
  reportId: number | null | undefined,
  type: string,
) => {
  if (type === 'dataset') {
    type = 'dataSet';
  }
  if (type === 'ruleset') {
    type = 'ruleSet';
  }
  if ([ReportTypeMenuItem.EDA, ReportTypeMenuItem.WHITEBOX, ReportTypeMenuItem.PREDICTION].includes(type as any)) {
    type = 'report';
  }
  const projectIdStr = projectId ? `${projectId}` : '0';
  const dataSetIdStr = dataSetId ? `${dataSetId}` : '0';
  const ruleSetIdStr = ruleSetId ? `${ruleSetId}` : '0';
  const reportIdStr = reportId ? `${reportId}` : '0';
  return `${projectIdStr}-${dataSetIdStr}-${ruleSetIdStr}-${reportIdStr}-${type}`;
};

export type RolapItemTypes = TinyTabInfo['type'] | TabType | 'rulesets_group' | 'reports_group';

export const isDataSet = (type: RolapItemTypes) => {
  return type === 'dataSet';
};

export const isDataSetV2 = (v2TabId: string) => {
  return 'dataSet' === v2TabId.split('-').slice(-1)[0];
};

export const isRuleSet = (type: RolapItemTypes) => {
  return type === 'ruleSet';
};

export const isRuleSetV2 = (v2TabId: string) => {
  return 'ruleSet' === v2TabId.split('-').slice(-1)[0];
};

export const isReport = (type: RolapItemTypes) => {
  return type === 'report';
};

export const isReportV2 = (v2TabId: string) => {
  return 'report' === v2TabId.split('-').slice(-1)[0];
};

export const isEdaWhiteOrBoxOrPrediction = (type: RolapItemTypes) => {
  return (
    type === ReportTypeMenuItem.EDA || type === ReportTypeMenuItem.WHITEBOX || type === ReportTypeMenuItem.PREDICTION
  );
};

export const isProcess = (type: RolapItemTypes) => {
  return type === 'process';
};

export const isProcessV2 = (v2TabId: string) => {
  return 'process' === v2TabId;
};

export const isCompare = (type: RolapItemTypes) => {
  return type === 'compare';
};

export const isRuleSetGroup = (type: RolapItemTypes) => {
  return type === 'rulesets_group';
};

export const isReportGroup = (type: RolapItemTypes) => {
  return type === 'reports_group';
};

export function generateConfusionMatrix(data: any) {
  const keys = Object.keys(data[0]);

  const means: any = {};
  keys.forEach((key) => {
    const sum = data.reduce((acc: any, obj: { [x: string]: any }) => acc + obj[key], 0);
    means[key] = sum / data.length;
  });

  const stdDeviations: any = {};
  keys.forEach((key) => {
    const sumOfSquares = data.reduce(
      (acc: number, obj: { [x: string]: number }) => acc + Math.pow(obj[key] - means[key], 2),
      0,
    );
    stdDeviations[key] = Math.sqrt(sumOfSquares / (data.length - 1));
  });

  const correlationMatrix: any[][] = [];
  keys.forEach((key1, i) => {
    const row: number[] = [];
    keys.forEach((key2, j) => {
      if (i === j) {
        row.push(1);
      } else {
        const sumProducts = data.reduce(
          (acc: number, obj: { [x: string]: number }) => acc + (obj[key1] - means[key1]) * (obj[key2] - means[key2]),
          0,
        );
        const correlation = sumProducts / ((data.length - 1) * stdDeviations[key1] * stdDeviations[key2]);
        row.push(correlation);
      }
    });
    correlationMatrix.push(row);
  });

  return {
    x: keys,
    y: keys,
    z: correlationMatrix,
  };
}

/**
 * Filters an array of V2Tab objects to return the IDs of tabs with type "ruleSet"
 * whose IDs start with the same prefix as the provided parent key.
 * This is used to determine which tabs (rulesets) are children of a given parent tab (dataSet).
 *
 * @param {V2Tab[]} allv2Tabs - The array of all V2Tab objects to filter.
 * @param {string} parentKey - The parent key used to determine the prefix for filtering.
 * @returns {string[]} - An array of tab IDs that match the filtering criteria.
 */
export function filterTabsByKey(allv2Tabs: V2Tab[], parentKey: string): string[] {
  const prefix = parentKey.split('-').slice(0, 2).join('-');
  return allv2Tabs.filter((tab) => tab.type === 'ruleSet' && tab.id.startsWith(prefix)).map((tab) => tab.id);
}
