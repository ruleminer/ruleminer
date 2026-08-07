import { Premise } from '../models/ruleset';
import { ProjectRulesTableData } from '../project-rules/project-rules-table/models/rules-table';

export type PreparedRule = {
  uuid: string;
  string: string;
  premise: Premise;
  conclusion: {
    value: string;
  };
  autoIncrement: number;
};

export type SecondProjectRulesTableData = Omit<ProjectRulesTableData, 'ids'> & {
  ids: {
    ruleSetId: number | null; //On init this is null
    dataSetId: number;
    projectId: number;
  };
};
