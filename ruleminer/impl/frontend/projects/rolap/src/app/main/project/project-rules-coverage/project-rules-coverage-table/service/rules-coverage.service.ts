import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';
import { Observable, switchMap, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { environment } from 'projects/rolap/src/environments/environment';

import { AppState } from '../../../../../common/store/app-state.model';
import { getCurentTabRulesetPredictionConfig } from '../../../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';
import { V2RulesTableMeta } from '../../../../../common/store/v2RulesTable/types';
import { CoverageMatrix } from '../models';

@Injectable({
  providedIn: 'root',
})
export class RulesCoverageService {
  constructor(private http: HttpClient, private store: Store<AppState>) {}

  public getRulesCoverageMatrixWithPredictions(
    ruleset: { rules: any[]; meta: V2RulesTableMeta },
    rulesCoverage: any,
    originalRulesetId: number,
    datasetId: number,
    examplesIndices: number[],
  ): Observable<CoverageMatrix> {
    const predictionStrategy$ = this.store
      .select(getCurentTabRulesetPredictionConfig)
      .pipe(filterOutNullish(), take(1));
    return predictionStrategy$.pipe(
      switchMap((predictionStrategy) => {
        return this.http.put<any>(`${environment.calcApiUrl}/${datasetId}/coverage_matrix`, {
          original_ruleset_id: originalRulesetId,
          ruleset: ruleset,
          rule_coverage: rulesCoverage,
          example_indices: examplesIndices,
          prediction_config: predictionStrategy,
        });
      }),
    );
  }
}
