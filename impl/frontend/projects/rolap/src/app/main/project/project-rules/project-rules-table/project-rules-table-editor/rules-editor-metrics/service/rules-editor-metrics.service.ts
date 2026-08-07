import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, map, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState, SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { mapBackendColumnNameToTranslateValue } from 'projects/rolap/src/app/common/utils/dataGridUtils';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';
import { environment } from 'projects/rolap/src/environments/environment';

import { getRulesBigTableVisibleColumnsBackendKeys } from '../../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { RulesCustomizeColumnsService } from '../../../../../service/rules-customize-columns.service';
import { RuleMetricEntry } from '../models';

@Injectable({
  providedIn: 'root',
})
export class RulesEditorMetricsService {
  constructor(
    private http: HttpClient,
    private store: Store<AppState>,
    private rulesTableColumnsService: RulesCustomizeColumnsService,
  ) {}

  public getRulesMetrics(
    dataSetId: number,
    rule: any, // TODO: fix type
    attributes: string[],
    problemType: ProblemTypes,
    metricsToCalculate: string[] | null = null,
  ): Observable<RuleMetricEntry[]> {
    let newRule = { ...rule };
    if (problemType !== ProblemTypes.Classification) {
      newRule = { ...newRule, conclusion: { ...newRule.conclusion, fixed: newRule.conclusion.fixed || true } };
    }

    const body: Record<string, any> = {
      rule: newRule,
      attributes,
    };
    if (metricsToCalculate) {
      body['metrics_to_calculate'] = metricsToCalculate;
    }
    return this.http.put<Record<string, number>>(`${environment.calcApiUrl}/${dataSetId}/rule_indicators`, body).pipe(
      map((metrics: Record<string, number>) =>
        Object.entries(metrics).map(([key, value]) => {
          return { name: mapBackendColumnNameToTranslateValue(key), value: value } as RuleMetricEntry;
        }),
      ),
    );
  }

  public getAvailableRuleMetrics(projectId: number): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/lists/${projectId}/rule_available_indicators`);
  }

  public getMetricsNamesToDisplay(problemType: ProblemTypes, availableMetrics: string[]): Observable<string[]> {
    // to get up to date values and avoid cached values
    getRulesBigTableVisibleColumnsBackendKeys?.release();
    return this.store.select(getRulesBigTableVisibleColumnsBackendKeys).pipe(
      take(1),
      map((visibleColumnKeys: string[]) => {
        visibleColumnKeys = visibleColumnKeys.filter((c: string) => availableMetrics.includes(c));
        let metricsToDisplay: string[];
        if (visibleColumnKeys.length > 0) {
          metricsToDisplay = visibleColumnKeys;
        } else {
          const defaultColumnNames: string[] = Object.entries(
            this.rulesTableColumnsService.getConfig(problemType, SubTabsNames.RULES),
          ).map(([_, v]) => v.name as string);

          metricsToDisplay = defaultColumnNames
            .filter((c: string | string[]) => typeof c === 'string')
            .map((c: string) => mapBackendColumnNameToTranslateValue(c))
            .filter((c: string) => availableMetrics.includes(c));
        }
        return metricsToDisplay;
      }),
    );
  }
}
