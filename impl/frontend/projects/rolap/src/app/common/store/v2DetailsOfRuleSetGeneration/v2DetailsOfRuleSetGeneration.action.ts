import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { PredictionConfig, V2DetailsOfRuleSetGeneration } from './types';

/**
 * Details of rule set generation
 * This is for RuleSet -> Description sub tab -> Details of rule set generation
 *
 */

export const V2DetailsOfRuleSetGenerationActions = createActionGroup({
  source: 'V2 Details Of RuleSet Generation Actions',
  events: {
    Add: props<{ details: V2DetailsOfRuleSetGeneration }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),
    'Set prediction config ': props<{ predictionConfig: PredictionConfig }>(),
    'Set predition config complete': props<{ key: string; predictionConfig: PredictionConfig }>(),
  },
});
