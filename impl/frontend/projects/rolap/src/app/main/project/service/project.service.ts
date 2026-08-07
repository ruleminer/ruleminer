import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, catchError, map, of } from 'rxjs';

import hideToasts from 'devextreme/ui/toast/hide_toasts';
import { environment } from 'projects/rolap/src/environments/environment';

import { ModalService } from '../../../common/services/modal/modal.service';
import { CreateAndUploadProjectResponse } from '../../../common/services/rule-set/rule-set-api';
import { Ids } from '../../../common/store/ruleSets/rulesets.selectors';
import { V2RulesTableData, V2RulesTableMeta } from '../../../common/store/v2RulesTable/types';
import { isDataSet } from '../../../common/store/v2Tabs/utils';
import { UploadDoneModalComponent } from '../../data-upload/upload-stepper-modal/upload-done-modal/upload-done-modal.component';
import { ProblemTypes } from '../../data-upload/utils/enums';
import {
  Algorithm,
  AllProjectsSummaryApiResponse,
  AttributeImportance,
  ConditionImportance,
  CrossValidation,
  NotAdvancedAlgorithmParams,
  PredictionIndicatorsResponse,
  Project,
  ProjectEdit,
  ProjectSummaryApiResponse,
  QuantitativeCharacteristics,
  Question,
  UploadResponse,
} from '../models/project';
import { ConditionCoverageRequest, JSONRuleSetResponse, RuleCoverageResponse } from '../models/ruleset';
import { QuestionRequest } from '../project-rules/modals/project-generate-rule-set-modal/simple-rules-generator/types';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private http: HttpClient, private modalService: ModalService) {}

  public getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}/projects`);
  }

  public getProject(projectId: number): Observable<Project> {
    return this.http.get<Project>(`${environment.apiUrl}/projects/${projectId}`);
  }

  public getProjectsSummary(
    limit: number,
    offset: number,
    sorting?: string | null,
  ): Observable<AllProjectsSummaryApiResponse> {
    let params = new HttpParams();

    if (sorting) {
      params = params.append('ordering', sorting);
    }

    return this.http.get<AllProjectsSummaryApiResponse>(
      `${environment.apiUrl}/projects/size?limit=${limit}&offset=${offset}`,
      { params },
    );
  }

  public getProjectSummary(projectId: number, limit: number, offset: number): Observable<ProjectSummaryApiResponse> {
    return this.http.get<ProjectSummaryApiResponse>(
      `${environment.apiUrl}/projects/${projectId}/size?limit=${limit}&offset=${offset}`,
    );
  }

  public getRulesetList(dataSetId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/datasets/${dataSetId}/rulesets`);
  }

  public getComparisonMeasures(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.calcApiUrl}/comparison_measures`);
  }

  public getRuleSet(dataSetId: number, ruleSetId: number): Observable<JSONRuleSetResponse> {
    return this.http.get<JSONRuleSetResponse>(`${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}`);
  }

  public deleteDataSetRow(dataSetId: number, rowId: number): Observable<string> {
    return this.http.delete<string>(`${environment.apiUrl}/datasets/${dataSetId}/rows/${rowId}`);
  }

  public getRulesCoverage(dataSetId: number, ruleSetId: number): Observable<RuleCoverageResponse> {
    return this.http.get<RuleCoverageResponse>(
      `${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/rules_coverage`,
    );
  }

  public getConditionsImportance(dataSetId: number, ruleSetId: number): Observable<ConditionImportance[]> {
    return this.http.get<ConditionImportance[]>(
      `${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/conditions_importance`,
    );
  }

  public getConditionsCoverage(dataSetId: number, data: ConditionCoverageRequest): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/datasets/${dataSetId}/condition_coverage`, data);
  }

  /**
   * Retrieves the default Kaplan-Meier estimator for a given dataset.
   *
   * This method calls `getConditionsCoverage` with the specified dataset ID and request data,
   * then extracts and returns the `kaplan_meier_estimator` from the result.
   */
  public getDefaultKaplanaMeierEstimator(dataSetId: number, data: ConditionCoverageRequest): Observable<any> {
    return this.getConditionsCoverage(dataSetId, data).pipe(
      map((res) => {
        const kaplanMeier = res[0].kaplan_meier_estimator;
        return kaplanMeier;
      }),
    );
  }

  public getRulesIndicators(dataSetId: number, ruleSetId: number): Observable<any[]> {
    return this.http
      .get<any[]>(`${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/rules_indicators`)
      .pipe(map((data: any) => data.indicators_data));
  }

  public putRulesIndicators(dataSetId: number, body: any): Observable<any> {
    return this.http
      .put<any>(`${environment.calcApiUrl}/${dataSetId}/rules_indicators`, body)
      .pipe(map((data: any) => data.indicators_data));
  }

  public getRulesIndicatorsWithCoverage(ids: Ids, data: any, table: V2RulesTableData) {
    const rulesIndicatorsBody = {
      ruleset: data.ruleset,
      rule_coverage: data.rule_coverage,
    };

    return this.putRulesIndicators(ids.dataSetId!, rulesIndicatorsBody).pipe(
      map((rulesIndicators) => {
        return { table, rulesIndicators, rulesCoverage: rulesIndicatorsBody.rule_coverage };
      }),
    );
  }

  public getQuantitativeCharacteristics(dataSetId: number, ruleSetId: number): Observable<QuantitativeCharacteristics> {
    return this.http.get<QuantitativeCharacteristics>(
      `${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/quantitative_characteristic`,
    );
  }

  public getPredictionIndicators(dataSetId: number, ruleSetId: number): Observable<PredictionIndicatorsResponse> {
    return this.http.get<PredictionIndicatorsResponse>(
      `${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/prediction_indicators`,
    );
  }

  public putPredictionIndicators(ids: Partial<Ids>, body: any): Observable<any> {
    return this.http.put<any>(`${environment.calcApiUrl}/${ids.dataSetId}/prediction_indicators`, body);
  }

  public putPredictionIndicatorsMapped(ids: Ids, data: any): Observable<any> {
    return this.putPredictionIndicators(ids, data).pipe(
      map((data) => data.general),
      map(({ ['Confusion_matrix']: remove, ...rest }) => rest),
    );
  }

  public putQuantitativeCharacteristics(ids: Ids, body: any): Observable<any> {
    return this.http.put<any>(`${environment.calcApiUrl}/${ids.dataSetId}/quantitative_characteristic`, body);
  }

  public putImportance(ids: Ids, body: any): Observable<any> {
    return this.http.put<any>(`${environment.calcApiUrl}/${ids.dataSetId}/importance`, body);
  }

  public getAttributesImportance(dataSetId: number, ruleSetId: number): Observable<AttributeImportance[]> {
    return this.http.get<AttributeImportance[]>(
      `${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/attributes_importance`,
    );
  }

  public getRulesImportance(
    dataSetId: number,
    ruleSetId: number,
  ): Observable<{
    attribute_importance: any;
    condition_importance: any;
  }> {
    return this.http.get<any>(`${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/importance`);
  }

  public getCrossValidation(dataSetId: number, ruleSetId: number): Observable<CrossValidation | null> {
    return this.http
      .get<CrossValidation | null>(`${environment.apiUrl}/datasets/${dataSetId}/rulesets/${ruleSetId}/crossvalidation`)
      .pipe(
        catchError((errorResponse: HttpErrorResponse) => {
          if (errorResponse.status === 404) {
            return of(null);
          } else {
            throw errorResponse;
          }
        }),
      );
  }

  public copyRuleSet(sourceDatasetId: string, ruleSetId: string, destinationDatasetId: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/datasets/${sourceDatasetId}/rulesets/${ruleSetId}/copy_to/${destinationDatasetId}`,
      {},
    );
  }

  public addProject(data: Partial<Project>): Observable<Partial<Project>> {
    return this.http.post<Partial<Project>>(`${environment.apiUrl}/projects`, data);
  }

  public editProject(data: ProjectEdit, projectId: number): Observable<ProjectEdit> {
    return this.http.patch<ProjectEdit>(`${environment.apiUrl}/projects/${projectId}`, data);
  }

  public deleteProject(projectId: number): Observable<string> {
    return this.http.delete<string>(`${environment.apiUrl}/projects/${projectId}`);
  }

  public deleteProjects(projectIds: number[]) {
    const commaSeparatedIds = projectIds.join(',');
    return this.http.delete(`${environment.apiUrl}/projects/delete_projects?projects=${commaSeparatedIds}`);
  }

  public deleteDataSets(projectId: number, dataSetIds: number[]) {
    const commaSeparatedIds = dataSetIds.join(',');
    return this.http.delete(
      `${environment.apiUrl}/projects/${projectId}/delete_datasets?datasets=${commaSeparatedIds}`,
    );
  }

  public getTreeView<T>(projectId: number): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}/projects/${projectId}/tree`);
  }

  public getAlgorithmsForProblem(problem: string): Observable<Algorithm[]> {
    return this.http.get<Algorithm[]>(`${environment.apiUrl}/algorithms?problem=${problem}`);
  }

  public getAlgorithmParams(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/algorithm/${id}/params`);
  }

  public postRulesIndices(
    dataSetId: number,
    ruleseet: { meta: V2RulesTableMeta; rules: any[] },
  ): Observable<{
    [key: string]: number[];
  }> {
    const url = `${environment.apiUrl}/datasets/${dataSetId}/rules_indices`;
    return this.http.post<any>(url, { ruleset: ruleseet });
  }

  public postIndexRuleCount(dataSetId: number, body: any): Observable<any> {
    const url = `${environment.apiUrl}/datasets/${dataSetId}/index_rulecount`;
    return this.http.post<any>(url, body);
  }

  public putPrediction(dataSetId: number, body: any): Observable<any> {
    const url = `${environment.calcApiUrl}/${dataSetId}/prediction`;
    return this.http.put<any>(url, body);
  }

  public putRulesCoverage(dataSetId: number, body: any): Observable<RuleCoverageResponse> {
    const url = `${environment.calcApiUrl}/${dataSetId}/rules_coverage`;
    return this.http.put<any>(url, body);
  }

  public getTypes(): Observable<{ types: string[] }> {
    return this.http.get<{ types: string[] }>(`${environment.apiUrl}/datasets/get_types`);
  }

  public uploadDataset(projectId: number, file: File, params: any): Observable<UploadResponse> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(params));

    return this.http.put<any>(`${environment.apiUrl}/project/${projectId}/upload`, formData);
  }

  public putLocalExplainability(dataSetId: number, body: any): Observable<any> {
    const url = `${environment.calcApiUrl}/${dataSetId}/local_explainability`;
    return this.http.put<any>(url, body);
  }

  public getQuestionForAlgorithm(algorithmId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${environment.apiUrl}/algorithm/${algorithmId}/questions/`);
  }

  public sendQuestionForAlgorithm(
    datasetId: number,
    algorithmId: number,
    body: QuestionRequest,
  ): Observable<NotAdvancedAlgorithmParams> {
    return this.http.post<NotAdvancedAlgorithmParams>(
      `${environment.apiUrl}/algorithm/${algorithmId}/${datasetId}/na_algorithm_params/`,
      body,
    );
  }

  public duplicateRuleSet(
    ruleSetId: number,
    body: {
      name: string;
      description: string;
    },
  ): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/duplicate_ruleset/${ruleSetId}/`, body);
  }

  public createAndUploadProject(file: File, params: any): Observable<CreateAndUploadProjectResponse> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(params));
    return this.http.post<any>(`${environment.apiUrl}/projects/create_and_upload`, formData);
  }

  public openUploadSuccessModal(
    ids: Ids,
    isNewProject: boolean,
    name: string,
    description: string,
    type: 'ruleSet' | 'dataSet' = 'dataSet',
  ): void {
    const title = isDataSet(type) ? 'project.uploaded_modal.dataset.title' : 'project.uploaded_modal.ruleset.title';
    this.modalService.open(UploadDoneModalComponent, title, '400px', undefined, {
      ids,
      isNewProject,
      name,
      description,
      type,
    });
    setTimeout(() => hideToasts(), 3000);
  }

  public createExampleProject(problemType: ProblemTypes, language: string): Observable<{ project_id: number }> {
    const queryParams = new HttpParams().append('problem_type', problemType).append('language', language);

    return this.http.post<{ project_id: number }>(`${environment.apiUrl}/projects/create_example_project`, null, {
      params: queryParams,
    });
  }
}
