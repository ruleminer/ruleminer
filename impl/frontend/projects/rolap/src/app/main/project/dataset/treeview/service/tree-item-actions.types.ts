import { Ids } from '../../../../../common/store/ruleSets/rulesets.selectors';

export interface ActionDefinition {
  execute: (ids: Ids, name: string, ...args: any[]) => void;
  translationKey: string;
}

export enum DatasetActionType {
  GENERATE = 'generate',
  ADD_RULESET = 'add_ruleset',
  IMPORT_RULESET = 'import_ruleset',
  DUPLICATE = 'duplicate',
  EDIT = 'edit',
  GENERATE_REPORTS = 'generate_reports',
  SPLIT = 'split',
  DELETE = 'delete',
}

export enum RulesetActionType {
  FILTER = 'filter',
  DUPLICATE = 'duplicate',
  EDIT = 'edit',
  DELETE = 'delete',
}

export enum ReportActionType {
  DOWNLOAD_REPORT = 'download_report',
  EDIT = 'edit',
  DELETE = 'delete',
}

export enum RulesetsGroupActionType {
  GENERATE = 'generate',
  COMPARE = 'compare',
}

export enum ReportsGroupActionType {
  GENERATE_REPORTS = 'generate_reports',
}

export interface DatasetActionSet {
  [DatasetActionType.GENERATE]: ActionDefinition;
  [DatasetActionType.ADD_RULESET]: ActionDefinition;
  [DatasetActionType.IMPORT_RULESET]: ActionDefinition;
  [DatasetActionType.DUPLICATE]: ActionDefinition;
  [DatasetActionType.EDIT]: ActionDefinition;
  [DatasetActionType.GENERATE_REPORTS]: ActionDefinition;
  [DatasetActionType.SPLIT]: ActionDefinition;
  [DatasetActionType.DELETE]: ActionDefinition;
}

export interface RulesetActionSet {
  [RulesetActionType.FILTER]: ActionDefinition;
  [RulesetActionType.DUPLICATE]: ActionDefinition;
  [RulesetActionType.EDIT]: ActionDefinition;
  [RulesetActionType.DELETE]: ActionDefinition;
}

export interface ReportActionSet {
  [ReportActionType.DOWNLOAD_REPORT]: ActionDefinition;
  [ReportActionType.EDIT]: ActionDefinition;
  [ReportActionType.DELETE]: ActionDefinition;
}

export interface RulesetsGroupActionSet {
  [RulesetsGroupActionType.GENERATE]: ActionDefinition;
  [RulesetsGroupActionType.COMPARE]: ActionDefinition;
}

export interface ReportsGroupActionSet {
  [ReportsGroupActionType.GENERATE_REPORTS]: ActionDefinition;
}

// Union type for convenience if needed elsewhere
export type AnyActionSet =
  | DatasetActionSet
  | RulesetActionSet
  | ReportActionSet
  | RulesetsGroupActionSet
  | ReportsGroupActionSet;

export type AllActionTypes =
  | DatasetActionType
  | RulesetActionType
  | ReportActionType
  | RulesetsGroupActionType
  | ReportsGroupActionType;
