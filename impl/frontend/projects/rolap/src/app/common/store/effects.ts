import { AttributesEffects } from './attributes/attributes.effects';
import { AuthEffects } from './auth/auth.effects';
import { IndicatorsMetaEffects } from './indicatorsMeta/indicatorsMeta.effects';
import { LimitsEffects } from './limits/limits.effects';
import { PredictionConfigOptionsEffects } from './predictionConfigOptions/predictionConfigOptions.effects';
import { ProjectEffects } from './project/project.effects';
import { ProjectSearchEffects } from './projectSearch/projectSearch.effects';
import { TabsEffects } from './ruleSets/rulesets.effects';
import { TourEffects } from './tour/tour.effects';
import { V2ClassifyEffects } from './v2Classify/v2Classify.effects';
import { V2ComparisonEffects } from './v2Comparison/v2Comparison.effects';
import { V2DataSetTableEffects } from './v2DataSetTable/v2DataSetTable.effects';
import { V2DetailsOfRuleSetGenerationEffects } from './v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.effects';
import { V2PredictionQualityTabEffects } from './v2PredictionQualityTab/v2PredictionQualityTab.effects';
import { V2PredictionTabEffects } from './v2PredictionTab/v2PredictionTab.effects';
import { V2RulesCoverageTabEffects } from './v2RulesCoverageTab/v2RulesCoverageTab.effects';
import { V2RulesTableEffects } from './v2RulesTable/v2RulesTable.effects';
import { V2StatisticsTabEffects } from './v2StatisticsTab/v2StatisticsTab.effects';
import { V2TabsEffects } from './v2Tabs/v2Tabs.effects';
import { v2VisualizationTabEffects } from './v2VisualizationTab/v2VisualizationTab.effects';
import { VersionEffect } from './version/version.effect';

export const effects: any[] = [
  TabsEffects,
  ProjectEffects,
  V2TabsEffects,
  V2ClassifyEffects,
  V2RulesTableEffects,
  VersionEffect,
  LimitsEffects,
  PredictionConfigOptionsEffects,
  V2PredictionQualityTabEffects,
  V2StatisticsTabEffects,
  V2DetailsOfRuleSetGenerationEffects,
  V2RulesCoverageTabEffects,
  V2ComparisonEffects,
  V2DataSetTableEffects,
  v2VisualizationTabEffects,
  ProjectSearchEffects,
  AttributesEffects,
  TourEffects,
  AuthEffects,
  IndicatorsMetaEffects,
  V2PredictionTabEffects,
];

// Use this when you want to do nothing in the effect
export enum CustomActionTypes {
  NO_ACTION = 'NO_ACTION',
}
