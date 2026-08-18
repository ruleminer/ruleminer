import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

import { PredictionConfigOptions } from '../store/predictionConfigOptions/types';
import { PredictionConfig } from '../store/v2DetailsOfRuleSetGeneration/types';

@Injectable({
  providedIn: 'root',
})
export class PredictionConfigService {
  constructor(private http: HttpClient) {}

  /**
   * Fetches possible prediction config options to choose from, based on current project type.
   *
   * @param projectId
   * @returns prediction config options
   */
  public getPredictionConfigOptions(projectId: number): Observable<PredictionConfigOptions> {
    return this.http.get<PredictionConfigOptions>(
      `${environment.apiUrl}/projects/${projectId}/prediction_config/options`,
    );
  }

  /**
   * Fetches prediction config for given ruleset.
   *
   * @param datasetId
   * @param ruleSetId
   * @returns prediction config
   */
  public getRuleSetPredictionConfig(datasetId: number, ruleSetId: number): Observable<PredictionConfig> {
    return this.http.get<PredictionConfig>(
      `${environment.apiUrl}/datasets/${datasetId}/rulesets/${ruleSetId}/prediction_config`,
    );
  }
}
