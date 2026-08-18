import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { PredictionConfig } from 'projects/rolap/src/app/common/store/v2DetailsOfRuleSetGeneration/types';

import { environment } from '../../../../../environments/environment';

export interface FilterRequest {
  name: string;
  description: string;
  filter_algorithm: string;
  voting_measure: string;
  prediction_config: PredictionConfig;
  loss?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  constructor(private http: HttpClient) {}
  public filterRuleset(rulesetId: number, body: FilterRequest) {
    return this.http.post<{ task_id: number }>(`${environment.apiUrl}/filter_ruleset/${rulesetId}/`, body);
  }
}
