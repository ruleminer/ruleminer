import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CopyRulesetRequest,
  CreateRulesetRequest,
  ProcessCreatedResponse,
  Rule,
  RuleSetDetailsRequest,
  RuleSetDetailsResponse,
} from '../../../main/project/models/ruleset';
import { V2RulesTableMeta } from '../../store/v2RulesTable/types';
import { RuleSetGenerationRequest, RulesetOverwriteRequest } from './rule-set-api';

@Injectable({
  providedIn: 'root',
})
export class RuleSetApiService {
  constructor(private http: HttpClient) {}

  public postRuleSetGeneration(dataSetId: number, body: RuleSetGenerationRequest): Observable<ProcessCreatedResponse> {
    const url = `${environment.apiUrl}/datasets/${dataSetId}/ruleset_generation`;
    return this.http.post<ProcessCreatedResponse>(url, body);
  }

  public duplicateRuleSet(ruleSetId: number, body: RuleSetDetailsRequest): Observable<any> {
    const url = `${environment.apiUrl}/duplicate_ruleset/${ruleSetId}/`;
    return this.http.post<any>(url, body);
  }

  public overWriteRuleSet(ruleSetId: number, body: RulesetOverwriteRequest): Observable<ProcessCreatedResponse> {
    const url = `${environment.apiUrl}/overwrite_ruleset/${ruleSetId}/`;
    return this.http.patch<ProcessCreatedResponse>(url, body);
  }

  public copyRuleSet(ruleSetId: number, dataset: number, body: CopyRulesetRequest): Observable<ProcessCreatedResponse> {
    const url = `${environment.apiUrl}/copy_ruleset/${ruleSetId}/to_dataset/${dataset}/`;
    return this.http.post<ProcessCreatedResponse>(url, body);
  }

  public saveRuleSet(ruleSetId: number, body: any): Observable<ProcessCreatedResponse> {
    const url = `${environment.apiUrl}/save_ruleset/${ruleSetId}/`;
    return this.http.post<ProcessCreatedResponse>(url, body);
  }

  public createRuleSet(body: CreateRulesetRequest): Observable<ProcessCreatedResponse> {
    const url = `${environment.apiUrl}/create_ruleset/`;
    return this.http.post<ProcessCreatedResponse>(url, body);
  }

  public deleteRuleset(dataSetId: number, ruleSetId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}`);
  }

  public renameRuleset(dataSetId: number, ruleSetId: number, data: RuleSetDetailsRequest) {
    return this.http.patch<RuleSetDetailsRequest>(
      `${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/details`,
      data,
    );
  }

  public getLabels(rulesetId: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${environment.apiUrl}/rulesets/${rulesetId}/labels`);
  }

  public saveLabels(rulesetId: number, labels: Record<string, number[]>) {
    return this.http.post(`${environment.apiUrl}/rulesets/${rulesetId}/labels`, labels).pipe(
      catchError((errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 404) {
          return of(null);
        } else {
          throw errorResponse;
        }
      }),
    );
  }

  public getRulesetDetails(dataSetId: number, ruleSetId: number): Observable<RuleSetDetailsResponse> {
    return this.http.get<any>(`${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/details`);
  }

  public getRulesetPrediction(
    dataSetId: number,
    ruleset: { meta: V2RulesTableMeta; rules: Rule[] },
    rulesCoverage: { [key: string]: any },
    originalRulesetId: number,
    examplesIndices: number[],
  ): Observable<{ [key: string]: string }> {
    return this.http.put<{ [key: string]: string }>(`${environment.calcApiUrl}/${dataSetId}/prediction`, {
      original_ruleset_id: originalRulesetId,
      ruleset: ruleset,
      rule_coverage: rulesCoverage,
      example_indices: examplesIndices,
    });
  }
  public getPredictionAfterUpload(
    file: File,
    dataSetId: number,
    dataset_info: { delimiter: string; decimal_separator: string; encoding: string; missing_value_sign: string },
    ruleset_info: { ruleset: any; rule_coverage: any; original_ruleset_id: number },
  ): Observable<HttpResponse<Blob>> {
    const payload = {
      dataset_info,
      ruleset_info,
    };

    let params = new HttpParams();
    params = params.set('format_type', 'xlsx');
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(payload));
    return this.http.put<Blob>(`${environment.calcApiUrl}/${dataSetId}/prediction_on_uploaded?format_type=`, formData, {
      params,
      observe: 'response',
      responseType: 'blob' as 'json',
    });
  }
}
