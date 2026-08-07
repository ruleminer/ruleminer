import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PredictionConfigOptions } from 'projects/rolap/src/app/common/store/predictionConfigOptions/types';

/**
 * Utility function building prediction configuration form group. This function should
 * be used to build form group passed to {@link RulesetPredictionConfigurationComponent}
 * to guarantee that form group always has proper structure.
 *
 * @param fb form builder
 * @param predictionConfigOptions possible prediction config options fetched from store
 * using {@link selectPredictionConfigOptions} selector
 * @returns form group
 */
export function buildPredictionConfigForm(
  fb: FormBuilder,
  predictionConfigOptions: PredictionConfigOptions,
): FormGroup {
  return fb.group({
    prediction_strategy: [predictionConfigOptions.prediction_strategy.default, [Validators.required]],
    use_default_rule: [true, [Validators.required]],
    voting_measure: [predictionConfigOptions.voting_measure?.default || undefined],
  });
}
