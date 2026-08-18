import { Injectable } from '@angular/core';

import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { RulesEditorConfig, RulesEditorDisplayTypes } from '../types/rules-editor';

/**
 * Builds config for rules editor based on the selected display type
 *
 * @export
 * @class RulesEditorConfigFactory
 */
@Injectable({
  providedIn: 'root',
})
export class RulesEditorConfigFactory {
  private readonly defaultConfig: RulesEditorConfig = {
    isManually: false,
    isEdit: false,
    isCondition: false,
    isExpertRules: false,
    isForbidden: false,

    useScrollView: false,
    shouldShowSidePanel: false,
  };

  public make(problemType: ProblemTypes, displayType: RulesEditorDisplayTypes): RulesEditorConfig {
    const config: RulesEditorConfig = { ...this.defaultConfig };
    switch (displayType) {
      case RulesEditorDisplayTypes.RULE_ADDING_STORE:
        config.isManually = true;
        break;
      case RulesEditorDisplayTypes.RULE_ADDING_BACKEND:
        config.isManually = true;
        break;
      case RulesEditorDisplayTypes.RULE_EDITING:
        config.isEdit = true;
        config.isManually = true;
        break;
      case RulesEditorDisplayTypes.RULE_EDITING_NOT_COVERED:
        config.isEdit = true;
        config.isManually = true;
        break;
      case RulesEditorDisplayTypes.EXPERT_RULES:
        config.isExpertRules = true;
        break;
      case RulesEditorDisplayTypes.EXPERT_PREFERRED_CONDITIONS:
        config.isCondition = true;
        break;
      case RulesEditorDisplayTypes.EXPERT_FORBIDDEN_CONDITIONS:
        config.isCondition = true;
        config.isForbidden = true;
        break;
      default:
        throw new Error(`Unknown display type: ${displayType}`);
    }
    config.shouldShowSidePanel = this.shouldShowSidePanel(config, problemType);

    return config;
  }

  private shouldShowSidePanel(config: RulesEditorConfig, problemType: ProblemTypes): boolean {
    const isClassification = problemType === ProblemTypes.Classification;
    return !config.isCondition || !config.isForbidden || isClassification;
  }
}
