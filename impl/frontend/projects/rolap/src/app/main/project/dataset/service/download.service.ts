import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

import { PredictionConfig } from '../../../../common/store/v2DetailsOfRuleSetGeneration/types';
import { datasetFilterMapper } from '../../../data-upload/utils/utils';
import { JSONRuleSetResponse } from '../../models/ruleset';
import { ExportType } from '../../project-rules/project-rules-table/models/export-type';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  private http = inject(HttpClient);

  public downloadDataset(
    datasetId: number,
    format_type: ExportType,
    filter?: any,
    columns: string[] = [],
  ): Observable<any> {
    const body = { columns: columns };
    let params = new HttpParams();
    params = params.set('format_type', format_type.toLowerCase());

    if (filter) {
      const filters = datasetFilterMapper(filter);
      for (const filterItem of filters) {
        const [paramName, paramValue] = filterItem;
        if (paramName && paramValue) {
          params = params.set(paramName, paramValue);
        }
      }
    }
    return this.http.put<any>(`${environment.apiUrl}/download/datasets/${datasetId}`, body, {
      params: params,
      observe: 'response',
      responseType: 'blob' as 'json',
    });
  }

  public downloadDatasetFilteredByRules(
    format_type: ExportType,
    dataSetId: number,
    ruleSet: JSONRuleSetResponse,
  ): Observable<any> {
    const body = { ruleset: ruleSet };
    let params = new HttpParams();

    params = params.set('format_type', format_type.toLowerCase());

    return this.http.put(`${environment.apiUrl}/download/datasets_filtered_by_rules/${dataSetId}`, body, {
      params: params,
      observe: 'response',
      responseType: 'blob' as 'json',
    });
  }

  public downloadRulesetExampleCoverage(
    format_type: ExportType,
    ruleSetId: number,
    ruleSet: JSONRuleSetResponse,
  ): Observable<any> {
    const body = { ruleset: ruleSet };
    let params = new HttpParams();

    params = params.set('format_type', format_type.toLowerCase());

    return this.http.put(`${environment.apiUrl}/download/ruleset_example_coverage/${ruleSetId}`, body, {
      params: params,
      observe: 'response',
      responseType: 'blob' as 'json',
    });
  }

  public downloadRulesetImportance(
    datasetId: number,
    format_type: ExportType,
    importance_of: 'condition' | 'attribute',
  ): Observable<any> {
    let params = new HttpParams();
    params = params.set('format_type', format_type.toLowerCase());
    params = params.set('importance_of', importance_of);
    return this.http.get<any>(`${environment.apiUrl}/download/ruleset_importance/${datasetId}`, {
      params: params,
      observe: 'response',
      responseType: 'blob' as 'json',
    });
  }

  public downloadPredictionRuleset(
    datasetId: number,
    format_type: ExportType,
    ruleset: any,
    rule_coverage: any,
    original_ruleset_id: number,
    prediction_config: PredictionConfig,
  ): Observable<any> {
    let params = new HttpParams();
    params = params.set('format_type', format_type.toLowerCase());

    const body = {
      ruleset,
      rule_coverage,
      original_ruleset_id,
      prediction_config,
    };

    return this.http.put<any>(`${environment.calcApiUrl}/download/datasets_prediction/${datasetId}`, body, {
      params: params,
      observe: 'response',
      responseType: 'blob' as 'json',
    });
  }
}
