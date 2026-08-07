import { Component } from '@angular/core';

import { Observable, map } from 'rxjs';

import { Store, select } from '@ngrx/store';

import { AppState } from '../../../../common/store/app-state.model';
import { getCurentTabRulesetPredictionConfig } from '../../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';

@Component({
  selector: 'rolap-ruleset-generation-predition-config-table',
  templateUrl: './ruleset-generation-predition-config-table.component.html',
})
export class RulesetGenerationPreditionConfigTableComponent {
  predictionConfig$: Observable<Record<string, string | number | undefined>>;

  constructor(private store: Store<AppState>) {
    this.predictionConfig$ = this.store.pipe(
      select(getCurentTabRulesetPredictionConfig),
      map((config) => {
        if (!config) return {};
        const result: Record<string, string | number | undefined> = {};
        for (const key in config) {
          const value = config[key as keyof typeof config];
          if (typeof value === 'boolean') {
            result[key] = value.toString();
          } else {
            result[key] = value;
          }
        }
        return result;
      }),
    );
  }
}
