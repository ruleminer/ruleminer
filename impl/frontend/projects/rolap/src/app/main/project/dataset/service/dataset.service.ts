import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, map } from 'rxjs';

import { Store } from '@ngrx/store';
import { DataType } from 'devextreme/common';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { FilterOperators, UniqueCoverage } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';
import { environment } from 'projects/rolap/src/environments/environment';

import { V2RulesTableMeta, v2AttributeMinMaxValues } from '../../../../common/store/v2RulesTable/types';
import { ReportTypes } from '../../../data-upload/utils/enums';
import { KaplanMeierCurve, SplitInfo } from '../../../data-upload/utils/types';
import { datasetFilterMapper } from '../../../data-upload/utils/utils';
import { MatchingDataset, MatchingDatasetsRequestBody } from '../../models/project';
import { GenerateReportResponse, JSONRuleSetResponse, Rule, RulesetImport } from '../../models/ruleset';
import { NominalAttributes } from '../../project-rules/project-rules-table/project-rules-table-editor/types/rules-editor';
import {
  AttributeMinMaxValue,
  Column,
  DataSetDetailsRequest,
  Dataset,
  DatasetAttribute,
  DatasetData,
  DatasetResponse,
  RuleSetImportAlgorithm,
  TableRecord,
} from '../models/dataset';
import {
  AttributeStatistic,
  DatasetStatistics,
  DatasetStatisticsColumn,
  UnimportantAttributes,
} from '../models/dataset-statistics';
import { KnowledgeDiscoveryRequest } from '../treeview/modals/generate-reports/knowledge-discovery/knowledge-discovery-request';
import { PredictiveAnalysisRequest } from '../treeview/modals/generate-reports/predictive-analysis/predictive-analysis-request';
import { ReportFormMeta } from '../treeview/modals/generate-reports/report-form/report-form-meta';

@Injectable({
  providedIn: 'root',
})
export class DatasetService {
  public readonly ID_COLUMN_DISPLAY_NAME: string = '#';

  constructor(private http: HttpClient, private store: Store<AppState>) {}

  public getDatasetStatistic(datasetId: number): Observable<DatasetStatistics> {
    return this.http.get<DatasetStatistics>(`${environment.apiUrl}/datasets/${datasetId}/statistics`);
  }

  public getDatasetInfo(dataSetId: number): Observable<Dataset> {
    return this.http.get<Dataset>(`${environment.apiUrl}/datasets/${dataSetId}`);
  }

  public getAttributesMinMaxValues(dataSetId: number): Observable<v2AttributeMinMaxValues> {
    return this.getDatasetStatistic(dataSetId).pipe(
      map((statistics) => {
        const attributesMinMaxValues: { [key: string]: AttributeMinMaxValue } = {};
        statistics.columns.forEach((statisticsColumn: DatasetStatisticsColumn) => {
          attributesMinMaxValues[statisticsColumn.column_name] =
            this.getMinMaxFromAttributesStatistics(statisticsColumn);
        });
        return attributesMinMaxValues;
      }),
    );
  }

  public getAttributesMinMaxValuesWithStatistics(dataSetId: number): Observable<{
    attributesMinMaxValues: { [key: string]: AttributeMinMaxValue };
    statistics: DatasetStatistics;
  }> {
    return this.getDatasetStatistic(dataSetId).pipe(
      map((statistics) => {
        const attributesMinMaxValues: { [key: string]: AttributeMinMaxValue } = {};
        statistics.columns.forEach((statisticsColumn: DatasetStatisticsColumn) => {
          attributesMinMaxValues[statisticsColumn.column_name] =
            this.getMinMaxFromAttributesStatistics(statisticsColumn);
        });
        return { attributesMinMaxValues, statistics };
      }),
    );
  }

  public getMinMaxFromAttributesStatistics(statisticsColumn: DatasetStatisticsColumn): AttributeMinMaxValue {
    const min = Number.parseFloat(
      statisticsColumn.statistics.find((statistic: AttributeStatistic) => statistic.name === 'min')!.value,
    );
    const max = Number.parseFloat(
      statisticsColumn.statistics.find((statistic: AttributeStatistic) => statistic.name === 'max')!.value,
    );
    return {
      min,
      max,
    };
  }

  public getDataset(
    datasetId: number,
    limit = 20,
    offset = 0,
    sort?: { selector: string; desc: boolean }[],
    filter?: any,
  ): Observable<DatasetData> {
    let params = new HttpParams().set('limit', limit.toString()).set('offset', offset.toString());

    if (filter) {
      const filters = datasetFilterMapper(filter);
      for (const filterItem of filters) {
        const [paramName, paramValue] = filterItem;
        if (paramName && paramValue) {
          params = params.set(paramName, paramValue);
        }
      }
    }

    const body = { columns: [], sort };

    return this.http
      .post<DatasetResponse>(`${environment.apiUrl}/datasets/${datasetId}/preview`, body, {
        params: params,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map((response) => {
          response.records = this.mapColumnsToValues(response.columns, response.records) as any;
          return response;
        }),
      );
  }

  public getDatasetFilteredByRules(
    datasetId: number,
    limit = 20,
    offset = 0,
    sort?: { selector: string; desc: boolean }[],
    ruleset?: { meta: V2RulesTableMeta; rules: Rule[] },
    unique?: UniqueCoverage['unique_examples'],
    operator?: FilterOperators,
  ): Observable<DatasetData> {
    let params = new HttpParams().set('limit', limit.toString()).set('offset', offset.toString());
    if (ruleset?.rules.length == 0) {
      return this.getDataset(datasetId, limit, offset, sort);
    }

    if (!!operator) {
      params = params.set('operator', operator);
    }
    return this.http
      .post<DatasetResponse>(
        `${environment.apiUrl}/datasets/${datasetId}/rules_preview`,
        { ruleset: ruleset, unique, sort },
        { params: params },
      )
      .pipe(
        map((response) => {
          response.records = this.mapColumnsToValues(response.columns, response.records) as any;
          return response;
        }),
      );
  }

  public getNumberOfRulesCoveringEachRow(
    datasetId: number,
    ruleset: { meta: V2RulesTableMeta; rules: any[] },
  ): Observable<{ [key: string]: number }> {
    return this.http.post<{ [key: string]: number }>(`${environment.apiUrl}/datasets/${datasetId}/index_rulecount`, {
      ruleset: ruleset,
    });
  }

  public generateEdaReport(datasetId: number, reportName: string): Observable<GenerateReportResponse> {
    return this.http.post<any>(`${environment.apiUrl}/datasets/${datasetId}/generate_eda_report`, {
      title: reportName,
    });
  }

  public generateDiscoveryReport(
    datasetId: number,
    request: KnowledgeDiscoveryRequest,
  ): Observable<GenerateReportResponse> {
    return this.http.post<any>(`${environment.apiUrl}/datasets/${datasetId}/generate_discovery_report`, request);
  }

  public generatePredictionReport(
    datasetId: number,
    request: PredictiveAnalysisRequest,
  ): Observable<GenerateReportResponse> {
    return this.http.post<any>(`${environment.apiUrl}/datasets/${datasetId}/generate_prediction_report`, request);
  }

  public getReportSchema(datasetId: number, reportType: ReportTypes): Observable<ReportFormMeta[]> {
    return this.http.get<any>(`${environment.apiUrl}/datasets/${datasetId}/report_specification?type=${reportType}`);
  }

  public getAttributesForDataset(dataSetId: number): Observable<DatasetAttribute[]> {
    return this.http.get<DatasetAttribute[]>(`${environment.apiUrl}/datasets/${dataSetId}/attributes`);
  }

  public getDatasetTableBasedOnAttributes(
    projectId: number,
    ruleSetId: number,
    dataSetId: number,
    limit: number,
    offset: number,
  ) {
    return this.getDataset(dataSetId, limit, offset).pipe(
      map((response) => {
        return {
          ruleSetId,
          projectId,
          exampleTable: response.records,
          count: response.count,
          limit: response.limit,
          offset: response.offset,
        };
      }),
    );
  }

  public deleteDataset(dataSetId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/datasets/${dataSetId}`);
  }

  public renameDataset(dataSetId: number, data: DataSetDetailsRequest) {
    return this.http.patch<DataSetDetailsRequest>(`${environment.apiUrl}/datasets/${dataSetId}`, data);
  }

  public duplicateDataset(dataSetId: number, data: DataSetDetailsRequest) {
    return this.http.post<DataSetDetailsRequest>(`${environment.apiUrl}/datasets/${dataSetId}/clone`, data);
  }

  public splitDataset(dataSetId: number, data: SplitInfo) {
    return this.http.post<{
      train_dataset_id: number;
      test_dataset_id: number;
    }>(`${environment.apiUrl}/datasets/${dataSetId}/split`, data);
  }

  public saveFilterDataset(
    datasetId: number,
    name: string,
    sort?: { selector: string; desc: boolean }[],
    filter?: any,
    columns: string[] = [],
  ): Observable<{ dataset_id: number }> {
    const body = { columns: columns, name, sort };
    let params = new HttpParams();

    if (filter) {
      const filters = datasetFilterMapper(filter);
      for (const filterItem of filters) {
        const [paramName, paramValue] = filterItem;
        if (paramName && paramValue) {
          params = params.set(paramName, paramValue);
        }
      }
    }

    return this.http.post<{ dataset_id: number }>(`${environment.apiUrl}/datasets/${datasetId}/modify`, body, {
      params: params,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private mapColumnsToValues(schema: Column[], data: TableRecord[]): { [key: string]: any }[] {
    return data.map((record) => {
      const mappedRow: any = {};
      schema.forEach((columnSchema, index) => {
        mappedRow[columnSchema.name] = record.column_values[index];
      });
      mappedRow['#'] = record.id;
      return mappedRow;
    });
  }

  public getNominalAttributes(datasetId: number): Observable<NominalAttributes<string>> {
    return this.http.get<NominalAttributes<string>>(
      `${environment.apiUrl}/datasets/${datasetId}/get_nominal_attributes_with_values`,
    );
  }

  public getMatchingDatasets(projectId: number, body: MatchingDatasetsRequestBody): Observable<MatchingDataset[]> {
    return this.http.post<MatchingDataset[]>(`${environment.apiUrl}/projects/${projectId}/matching_datasets`, body);
  }

  public getClassDistribution(dataSetId: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${environment.apiUrl}/datasets/${dataSetId}/class_distribution`);
  }

  public getAvailableCodecs(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/datasets/codecs`);
  }

  public importRuleset(dataSetId: number, file: File, data: RulesetImport) {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(data));

    return this.http.post<any>(`${environment.apiUrl}/datasets/${dataSetId}/upload_ruleset`, formData);
  }

  public getUnimportantAttributes(dataSetId: number) {
    return this.http.get<UnimportantAttributes>(`${environment.apiUrl}/datasets/${dataSetId}/unimportant_attributes`);
  }

  public postRulesModify(name: string, dataSetId: number, ruleSet: JSONRuleSetResponse) {
    const body = { name, ruleset: ruleSet };
    const params = new HttpParams();

    return this.http.post<any>(`${environment.apiUrl}/datasets/${dataSetId}/rules_modify`, body, {
      params: params,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public getKaplanMeierCurve(dataSetId: number): Observable<KaplanMeierCurve> {
    return this.http.get<KaplanMeierCurve>(`${environment.apiUrl}/datasets/${dataSetId}/kaplan_meier`);
  }

  public mapBackendTypeToDevExtremeColumnType(type: string): DataType {
    switch (type) {
      case 'cat':
        return 'string';
      case 'num':
        return 'number';
      default:
        return 'string';
    }
  }

  public getImportRulesetAlgorithms(projectId: number): Observable<RuleSetImportAlgorithm[]> {
    return this.http.get<RuleSetImportAlgorithm[]>(
      `${environment.apiUrl}/project/${projectId}/import_ruleset_algorithms`,
    );
  }
}
