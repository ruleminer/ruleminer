import { Ids } from '../store/ruleSets/rulesets.selectors';

export interface TinyTabInfo {
  ids: Ids;
  type: 'ruleSet' | 'dataSet' | 'EDA' | 'WHITEBOX' | 'PREDICTION' | 'report';
}
