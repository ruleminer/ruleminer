import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, map, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState, Rule } from 'projects/rolap/src/app/common/store/app-state.model';
import { environment } from 'projects/rolap/src/environments/environment';

import { RegressionConclusionValue } from '../models/conclusion';
import { RegressionConditionCoverage } from '../models/coverage.model';

@Injectable({
  providedIn: 'root',
})
export class RegressionRuleConclusionService {
  constructor(private http: HttpClient, private store: Store<AppState>) { }

  public calculateRegressionConclusion(
    rule: Rule,
    datasetId: number,
    attributesNames: string[],
  ): Observable<RegressionConclusionValue> {
    return this.http
      .post<RegressionConditionCoverage[]>(`${environment.apiUrl}/datasets/${datasetId}/condition_coverage`, {
        meta: {
          attributes: attributesNames,
        },
        conditions: [rule.premise],
      })
      .pipe(
        map((coverage: RegressionConditionCoverage[]) => {
          const ruleCoverage = coverage[0];
          return {
            value: ruleCoverage.covered_y_mean,
            train_covered_y_min: ruleCoverage.covered_y_min,
            train_covered_y_max: ruleCoverage.covered_y_max,
            train_covered_y_std: ruleCoverage.covered_y_std,
            train_covered_y_mean: ruleCoverage.covered_y_mean,
            high: ruleCoverage.covered_y_mean + ruleCoverage.covered_y_std,
            low: ruleCoverage.covered_y_mean - ruleCoverage.covered_y_std,
            fixed: false,
          };
        }),
        take(1),
      );
  }
}
