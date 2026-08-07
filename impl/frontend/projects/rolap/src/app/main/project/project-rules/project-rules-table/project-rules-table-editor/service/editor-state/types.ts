import { ProblemTypes } from '../../../../../../data-upload/utils/enums';
import { RegressionConclusionValue } from '../../rules-editor-side-column/rule-conclusion-editor/regression/models/conclusion';
import { Subcondition } from '../../types/rules-editor';

export type ListValueObject = { didChange: boolean, value: Subcondition[] | null }

export type ConclusionEditorSurviavalObject = {
  value: string | number;
  median_survival_time_ci_lower: string | number;
  median_survival_time_ci_upper: string | number;
  fixed: boolean;
};

export type ConclusionEditorStates = {
  [ProblemTypes.Classification]: { value: string } | { value: string }[] | null;
  [ProblemTypes.Regression]: RegressionConclusionValue | null;
  [ProblemTypes.Survival]: ConclusionEditorSurviavalObject | ConclusionEditorSurviavalObject[] | null;
};

export type ConclusionEditorState =
  | ConclusionEditorStates[ProblemTypes.Classification]
  | ConclusionEditorStates[ProblemTypes.Regression]
  | ConclusionEditorStates[ProblemTypes.Survival];
