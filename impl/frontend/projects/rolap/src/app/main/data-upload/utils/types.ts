import { FileExtension, ProblemTypes } from './enums';

export type AvailableFileExtensions = FileExtension.csv | FileExtension.json | FileExtension.txt;

export interface FormModel {
  purpose: string;
  survivalNumericColumn: string | null;
  nonSurvivalNominalColumn: string | null;
  regressionColumn: string | null;
  nominalColumn: string | null;
  survivalNumericValue: string | null;
  nonSurvivalNumericValue: string | null;
  survivalNominalValue: string | null;
  nonSurvivalNominalValue: string | null;
}

export type FormData = {
  purpose: ProblemTypes;
  projectName: string | null;
  projectDescription: string | null;
};

export type Nullable<T> = T | null;

export type ParamName = 'expert_forbidden_conditions' | 'expert_preferred_conditions' | 'expert_rules';

export type ProjectFormValue = {
  formValue: FormData;
  isValid: boolean;
};

export type SummaryInfo = {
  number_of_rows: number;
  number_of_columns: number;
};

export type SplitInfo = {
  split_ratio: number;
  training_set_name: string;
  test_set_name: string;
  split_mode: string;
};

export interface DataUploadTypes {
  file: File;
  lines: string;
}

export interface TableInfo {
  number_of_rows: number;
  number_of_columns: number;
}

export interface KaplanMeierCurve {
  time: number[];
  events_count: number[];
  censored_count: number[];
  at_risk_count: number[];
  probability: number[];
}
