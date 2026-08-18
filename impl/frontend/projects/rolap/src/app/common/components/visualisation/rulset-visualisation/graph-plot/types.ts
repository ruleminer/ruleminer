import { Project } from '../../../../../main/project/models/project';
import { V2RulesTable, V2RulesTableMeta } from '../../../../store/v2RulesTable/types';

export interface GraphOptions {
  calculateCoverage: boolean;
  fullScreen: boolean;
  rules: V2RulesTable['data'] | null;
  meta: V2RulesTableMeta | null;
  ids: { dataSetId: number; projectId: number } | null;
  project: Project | null;
  data: any | null;
}
