export enum ProcessStatus {
  success = 'SUCCESS',
  pending = 'PENDING',
  failure = 'FAILURE',
  aborted = 'ABORTED',
  started = 'STARTED',
  stopped = 'STOPPED',
  stopping = 'STOPPING',
  stopped_clicked = 'STOPPED_CLICKED',
}

export enum ProcessType {
  learning = 'learning',
  report = 'report',
  crossValidation = 'cross-validation',
  saveRuleset = 'save-ruleset',
  filterRuleset = 'filter-ruleset',
}

export interface Process {
  create_timestamp: string;
  execution_time: number;
  finish_timestamp: string;
  project: number;
  result_content_type: string;
  result_object_id: number;
  source_content_type: string;
  source_object_id: number;
  start_timestamp: string;
  status: ProcessStatus;
  task_id: number;
  type: ProcessType;
}

export interface ProcessDetails extends Process {
  error_cause: string;
  meta: ProcessMeta;
}

export interface ProcessMeta {
  generated_rules: number;
  generation_params: { [key: string]: any };
  type: string;
  name: any;
  filter_algorithm: string;
  uncovered_examples_count: number;
  total_examples_count: number;
  title: string;
}

export interface FilterDataSource {
  text: string;
  value: string;
}
