import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Observable, combineLatest, filter, map, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState } from '../../../../common/store/app-state.model';
import { V2ComparisonForm } from '../../../../common/store/v2Comparison/types';
import {
  selectComparisonDataToCompare,
  selectComparisonMetaToCompare,
  selectComparisonSelectedRowsUUIDs,
  selectCurrentV2ComparisonForm,
} from '../../../../common/store/v2Comparison/v2Comparison.selectors';
import { V2RulesTableData, V2RulesTableMeta } from '../../../../common/store/v2RulesTable/types';
import {
  getRulesToCompare,
  selectProjectRulesTableData,
} from '../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { RulesTableRow } from '../../models/project';
import { RuleSimilarityRequest, RuleSimilarityResponse } from '../../models/ruleset';
import { CompareApiService } from '../../service/compare-api.service';
import { ComparisonCalulateSimilarityButtonOutput } from '../buttons/calculate-similarity-button/types';
import { PreparedRule } from '../types';

@Injectable({
  providedIn: 'root',
})
export class CompareCalculateSimilarityService {
  constructor(private compareApi: CompareApiService, private store: Store<AppState>) {}

  /**
   * Calculates the similarity between two rulesets and returns the result.
   */
  public calculateSimilarity(): Observable<ComparisonCalulateSimilarityButtonOutput> {
    return combineLatest([
      this.store.select(getRulesToCompare).pipe(filter((res) => !!res)),
      this.store.select(selectComparisonSelectedRowsUUIDs).pipe(filter((rows) => !!rows.length)),
      this.store.select(selectCurrentV2ComparisonForm).pipe(filter((form) => !!form)),
      this.store.select(selectComparisonDataToCompare).pipe(filterOutNullish()),
      this.store.select(selectComparisonMetaToCompare).pipe(filterOutNullish()),
      this.store.select(selectProjectRulesTableData).pipe(filterOutNullish()),
    ]).pipe(
      switchMap(([res, selectedRows, form, rulesetDataToCompare, rulesetMetaToCompare, projectRulesTableData]) => {
        if (!res || !selectedRows || !form) {
          throw new Error('No ruleset data to compare');
        }
        const rulesetOneData = this.mapToPreparedRules(res.table);
        const rulesetTwoData = this.getFilteredRulesetTwoData(selectedRows, rulesetDataToCompare);
        return this.createAndSendSimilarityRequest(
          rulesetOneData,
          rulesetTwoData,
          res.meta,
          rulesetMetaToCompare,
          form,
          projectRulesTableData.ids.dataSetId,
        ).pipe(
          map((similarityData: RuleSimilarityResponse) => ({
            ruleSimilarity: similarityData.rule_similarity,
            rulesetOneData,
            rulesetTwoData,
            relationType: form.relationType,
          })),
        );
      }),
    );
  }

  /**
   * Creates a similarity request and sends it to the API.
   */
  private createAndSendSimilarityRequest(
    rulesetOneData: PreparedRule[],
    rulesetTwoData: PreparedRule[],
    rulesetOneMeta: V2RulesTableMeta,
    rulesetTwoMeta: V2RulesTableMeta,
    v2ComparisonForm: V2ComparisonForm,
    dataSetId: number,
  ): Observable<RuleSimilarityResponse> {
    const request = this.createSimilarityRequest(
      rulesetOneData,
      rulesetTwoData,
      rulesetOneMeta,
      rulesetTwoMeta,
      v2ComparisonForm,
    );
    return this.compareApi.putRulesetsSimilarity(dataSetId, request);
  }

  /**
   * Creates a similarity request based on the provided data.
   */
  private createSimilarityRequest(
    rulesetOneData: PreparedRule[],
    rulesetTwoData: PreparedRule[],
    rulesetOneMeta: V2RulesTableMeta,
    rulesetTwoMeta: V2RulesTableMeta,
    v2ComparisonForm: V2ComparisonForm,
  ): RuleSimilarityRequest {
    if (!v2ComparisonForm.similarityType && !v2ComparisonForm.comparisonMeasures) {
      throw new Error('Comparison measure is defined, but should be when similarityType is false.');
    }
    return {
      similarity_type: v2ComparisonForm.similarityType ? 'syntactic' : 'semantic',
      ...(!v2ComparisonForm.similarityType && {
        measure: v2ComparisonForm.comparisonMeasures as string,
      }),
      ruleset_1: {
        rules: rulesetOneData,
        meta: rulesetOneMeta,
      },
      ruleset_2: {
        rules: rulesetTwoData,
        meta: rulesetTwoMeta,
      },
    };
  }

  /**
   * Maps ruleset data to prepared rules.
   */
  private mapToPreparedRules(rulesetData: V2RulesTableData | RulesTableRow[]): PreparedRule[] {
    return rulesetData.map((row) => ({
      uuid: row.uuid,
      string: row.string,
      premise: row.premise,
      conclusion: row.conclusion,
      autoIncrement: row.autoIncrement,
    }));
  }

  /**
   * Filters and maps the ruleset data to prepared rules based on the selected rows.
   */
  private getFilteredRulesetTwoData(
    selectedRows: string[],
    rulesetDataToCompare: V2RulesTableData | undefined,
  ): PreparedRule[] {
    const filtered = rulesetDataToCompare?.filter((rule) => selectedRows.includes(rule.uuid));
    if (!filtered) {
      throw new Error('No ruleset data to compare');
    }
    return this.mapToPreparedRules(filtered);
  }
}
