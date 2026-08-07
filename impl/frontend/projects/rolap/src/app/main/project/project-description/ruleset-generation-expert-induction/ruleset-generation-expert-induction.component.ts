import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Observable, map } from 'rxjs';

import { Store, select } from '@ngrx/store';

import { AppState } from '../../../../common/store/app-state.model';
import { getCurentTabDescriptionAttributes } from '../../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';

interface ExpertInductionParams {
  consider_other_classes: boolean;
  extend_using_automatic: boolean;
  extend_using_preferred: boolean;
  induce_using_automatic: boolean;
  induce_using_preferred: boolean;
  preferred_attributes_per_rule: number;
  preferred_conditions_per_rule: number;
  expert_rules: [string, string][];
  expert_forbidden_conditions: [string, string][];
  expert_preferred_conditions: [string, string][];
}

interface DataModel {
  expertRules: [string, string][];
  expertForbiddenConditions: [string, string][];
  expertPreferredConditions: [string, string][];
  expertInductionParams: Omit<
    ExpertInductionParams,
    'expert_rules' | 'expert_forbidden_conditions' | 'expert_preferred_conditions'
  >;
}

@Component({
  selector: 'rolap-ruleset-generation-expert-induction',
  templateUrl: './ruleset-generation-expert-induction.component.html',
  styleUrls: ['./ruleset-generation-expert-induction.component.scss'],
})
export class RulesetGenerationExpertInductionComponent {
  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);

  public data$: Observable<DataModel | null> = this.store.pipe(
    select(getCurentTabDescriptionAttributes),
    filterOutNullish(),
    map((data) =>
      data.generation_params?.expert_induction
        ? {
            expertRules: data.generation_params.expert_induction.expert_rules,
            expertForbiddenConditions: data.generation_params.expert_induction.expert_forbidden_conditions,
            expertPreferredConditions: data.generation_params.expert_induction.expert_preferred_conditions,
            expertInductionParams: {
              consider_other_classes: data.generation_params.expert_induction.consider_other_classes,
              extend_using_automatic: data.generation_params.expert_induction.extend_using_automatic,
              extend_using_preferred: data.generation_params.expert_induction.extend_using_preferred,
              induce_using_automatic: data.generation_params.expert_induction.induce_using_automatic,
              induce_using_preferred: data.generation_params.expert_induction.induce_using_preferred,
              preferred_attributes_per_rule: data.generation_params.expert_induction.preferred_attributes_per_rule,
              preferred_conditions_per_rule: data.generation_params.expert_induction.preferred_conditions_per_rule,
            },
          }
        : null,
    ),
    filterOutNullish(),
    takeUntilDestroyed(this.destroyRef),
  );
}
