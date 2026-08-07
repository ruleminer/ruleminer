import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, mergeMap } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { environment } from 'projects/rolap/src/environments/environment';

import { getRuleSet } from '../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { LabelHistogramData } from '../models/label-histogram.model';

@Injectable({
  providedIn: 'root',
})
export class RegressionRuleHistogramService {
  private static readonly DEFAULT_BINS = 20;

  constructor(private store: Store<AppState>, private http: HttpClient) {}

  public getHistogramData(
    datasetId: number,
    rulesUuids: Iterable<string>,
    bins: number = RegressionRuleHistogramService.DEFAULT_BINS,
  ): Observable<LabelHistogramData> {
    return this.store.select(getRuleSet).pipe(
      mergeMap((ruleset) => {
        return this.http.put<any>(`${environment.calcApiUrl}/${datasetId}/label_histograms`, {
          ruleset: ruleset,
          bins: bins,
          for_rules: rulesUuids,
        });
      }),
    );
  }
}
