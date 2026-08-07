import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RuleSimilarityRequest, RuleSimilarityResponse } from '../models/ruleset';
import {
  CompareQuantitativeCharacteristics,
  PredictionIndicatorsSummaryBody,
  RuleSetIndicators,
} from './models/compare.model';

@Injectable({
  providedIn: 'root',
})
export class CompareApiService {
  constructor(private http: HttpClient) {}

  public getPredictiveQuantitativeCharacteristics(dataSetId: number): Observable<CompareQuantitativeCharacteristics[]> {
    return this.http.get<CompareQuantitativeCharacteristics[]>(
      `${environment.apiUrl}/datasets/${dataSetId}/rulesets/quantitative_characteristics`,
    );
  }

  public getPredictiveIndicators(dataSetId: number): Observable<RuleSetIndicators[]> {
    return this.http.get<RuleSetIndicators[]>(
      `${environment.apiUrl}/datasets/${dataSetId}/rulesets/prediction_indicators`,
    );
  }

  public getPredictionIndicatorsSummary(
    dataSetId: number,
    body: PredictionIndicatorsSummaryBody,
  ): Observable<RuleSetIndicators[]> {
    return this.http.post<RuleSetIndicators[]>(
      `${environment.calcApiUrl}/${dataSetId}/prediction_indicators_summary`,
      body,
    );
  }

  public putRulesetsSimilarity(dataSetId: number, request: RuleSimilarityRequest): Observable<RuleSimilarityResponse> {
    return this.http.put<any>(`${environment.calcApiUrl}/${dataSetId}/rule_similarity`, request);
  }
}
