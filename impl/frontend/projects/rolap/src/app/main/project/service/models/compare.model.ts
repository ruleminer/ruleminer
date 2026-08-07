import { QuantitativeCharacteristics } from '../../models/project';

export type PredictionIndicatorsSummaryBody = {
  dataset_id: number;
  ruleset_ids: number[];
};

export interface CompareQuantitativeCharacteristics extends QuantitativeCharacteristics {
  id: number;
  name: string;
  fraction_significant: number;
  fraction_FDR_significant: number;
  total_conditions_count: number;
}

interface ConfusionMatrix {
  [className: string]: number[];
}

interface ClassMetrics {
  TP: number;
  FP: number;
  TN: number;
  FN: number;
  Recall: number;
  Specificity: number;
  F1_score: number;
  G_mean: number;
  MCC: number;
  PPV: number;
  NPV: number;
  LR_plus: number;
  LR_minus: number;
  Odd_ratio: number;
  Relative_risk: number;
  Confusion_matrix: ConfusionMatrix;
}

interface GeneralMetrics {
  Accuracy: number;
  F1_macro: number;
  F1_micro: number;
  F1_weighted: number;
  Specificity: number;
  G_mean_macro: number;
  G_mean_micro: number;
  Recall_macro: number;
  Recall_micro: number;
  G_mean_weighted: number;
  Recall_weighted: number;
  Confusion_matrix: ConfusionMatrix;
  Balanced_accuracy: number;
}

interface PredictionIndicators {
  type_of_problem: string;
  general: GeneralMetrics;
  for_classes: { [className: string]: ClassMetrics };
}

export interface RuleSetIndicators {
  id: number;
  name: string;
  indicators: PredictionIndicators;
}
