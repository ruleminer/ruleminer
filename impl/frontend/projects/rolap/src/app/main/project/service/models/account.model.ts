export interface UserLimits {
  max_columns: number;
  max_datasets: number;
  max_projects: number;
  max_reports: number;
  max_rows: number;
  max_rulesets: number;
  max_size: number;
  max_sum_size: number;
  space_used: number;
}

export type MainLimits = Pick<UserLimits, 'max_projects' | 'max_rulesets' | 'max_datasets' | 'max_reports'>;
