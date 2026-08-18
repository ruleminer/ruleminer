export type PredictionConfigChoiceOption = {
  choices: string[];
  default: string;
};

export type PredictionConfigBooleanOption = {
  default: boolean;
};

export type PredictionConfigOptions = {
  prediction_strategy: PredictionConfigChoiceOption;
  use_default_rule: PredictionConfigBooleanOption;
  voting_measure: PredictionConfigChoiceOption;
};
/**
 * State containing prediction configuration options for current project.
 * Those options could be used to populate prediction configurations forms
 * with possible options for user to choose from.
 */
export type PredictionConfigOptionsState = {
  options: PredictionConfigOptions | null;
};
