import { FormGroup } from '@angular/forms';

export enum DisplayType {
  /** Display for rule set creation view */
  RuleSetCreation = 1,
  /** Display for existing ruleSet with already configured prediction */
  RuleSetTab = 2,
  /** Display for importing ruleSet from json or text */
  RuleSetImport = 3,
}

export interface RulesetPredictionConfigurationComponentData {
  displayType: DisplayType;
  formGroup?: FormGroup;
}
