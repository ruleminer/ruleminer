import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { Observable, combineLatest, zip } from 'rxjs';
import { map, mergeMap, shareReplay, take, tap } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import DataSource from 'devextreme/data/data_source';

import { buildRulesetFromActiveRowsForBackend } from '../../../main/data-upload/utils/utils';
import { RuleCoverageRow } from '../../../main/project/models/ruleset';
import { ResultFromSaveRulesTableModal } from '../../../main/project/project-rules/project-rules-table/buttons/rule-table-save-button/project-save-rules-table-modal/types';
import { ProjectService } from '../../../main/project/service/project.service';
import { AppState } from '../../store/app-state.model';
import { removeIfAndThenFromRule } from '../../store/ruleSets/rulesets.reducer';
import { V2ComparisonActions } from '../../store/v2Comparison/v2Comparison.action';
import { getCurentTabRulesetPredictionConfig } from '../../store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';
import {
  getRulesLabels,
  rulestToSave,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
} from '../../store/v2RulesTable/v2RulesTable.selectors';
import { V2TabsActions } from '../../store/v2Tabs/v2Tabs.action';
import { selectCurrentV2Tab } from '../../store/v2Tabs/v2Tabs.selectors';
import { RuleSetApiService } from './rule-set-api.service';

@Injectable({
  providedIn: 'root',
})
export class RuleSetService {
  constructor(
    private projectService: ProjectService,
    private ruleSetApiService: RuleSetApiService,
    private store: Store<AppState>,
  ) {}

  public getRulesetData(
    dataSetId: number,
    ruleSetId: number,
    isCompareTable: boolean,
    datasetIdForColumnsCalculation?: number,
  ) {
    const ruleSet$ = this.projectService.getRuleSet(dataSetId, ruleSetId).pipe(shareReplay(1), take(1));
    let coverage$: Observable<any>;
    let indicators$: Observable<any[]>;
    if (datasetIdForColumnsCalculation !== undefined) {
      coverage$ = this.calculateRuleSetCoverageData(ruleSet$, datasetIdForColumnsCalculation);
      indicators$ = this.calculateRuleSetIndicatorsData(ruleSet$, coverage$, datasetIdForColumnsCalculation);
    } else {
      coverage$ = this.projectService.getRulesCoverage(dataSetId, ruleSetId).pipe(take(1));
      indicators$ = this.projectService.getRulesIndicators(dataSetId, ruleSetId);
    }
    indicators$ = indicators$.pipe(
      take(1),
      map((indicators) =>
        indicators.map((indicator) => {
          return {
            rule_uuid: indicator.rule_uuid,
            ...indicator.indicators,
          };
        }),
      ),
    );

    const labels$ = this.ruleSetApiService.getLabels(ruleSetId);

    return zip(ruleSet$, coverage$, indicators$, labels$).pipe(
      take(1),
      map(([rules, coverage, indicators, labels]) => {
        const ids = rules.rules.map((data) => data.uuid);
        const mappedCoverage: RuleCoverageRow[] = [];
        for (const key in coverage.rule_coverage) {
          const values = coverage.rule_coverage[key];
          const rule: RuleCoverageRow = {
            ...values,
            uuid: key,
          };
          mappedCoverage.push(rule);
        }

        const matchingData: DataSource[] = ids.map((uuid, i) => {
          const row = {
            ...rules.rules
              // remove voting_weight field, it should not be displayed as column
              .map(({ voting_weight, ...attrToKepp }) => attrToKepp)
              .map((x) => ({ ...x, displayString: removeIfAndThenFromRule(x.string) }))
              .find((v) => v.uuid === uuid),
            ...mappedCoverage.find((d2) => d2.uuid === uuid),
            ...indicators.find((d3) => d3.rule_uuid === uuid),
            labels: labels[uuid],
            compare: i === 0 ? true : false,
            autoIncrement: i + 1,
          };

          if (i === 0 && isCompareTable) this.storeFirstSelectedRow(row);

          return row;
        });

        return { table: matchingData, meta: rules.meta, coverage };
      }),
    );
  }

  private calculateRuleSetCoverageData(
    ruleset: Observable<any>,
    datasetIdForColumnsCalculation: number,
  ): Observable<any> {
    return ruleset.pipe(
      mergeMap((ruleset) => {
        return this.projectService.putRulesCoverage(datasetIdForColumnsCalculation, ruleset);
      }),
      shareReplay(1),
      take(1),
    );
  }

  private calculateRuleSetIndicatorsData(
    ruleset$: Observable<any>,
    coverage$: Observable<any>,
    datasetIdForColumnsCalculation: number,
  ): Observable<any[]> {
    return combineLatest([ruleset$, coverage$]).pipe(
      mergeMap(([ruleset, rulesetCoverage]) => {
        const payload = {
          ruleset,
          rule_coverage: rulesetCoverage.rule_coverage,
        };
        return this.projectService.putRulesIndicators(datasetIdForColumnsCalculation, payload);
      }),
      take(1),
    );
  }

  public storeFirstSelectedRow(row: any) {
    const rowUUid = row.uuid;
    if (!rowUUid) throw new Error('missing uuid');
    this.store.dispatch(V2ComparisonActions.setSelectedRows({ selectedRowsUUIDs: [rowUUid] }));
  }

  /**
   * Saves or overwrites a ruleset based on user input by sending request to the api.
   * @param {ResultFromSaveRulesTableModal} resultData - Data from the save rules modal, including prediction configuration and ruleset metadata and overwrite flag.
   * @returns {Observable<{ contentTranslateKey: string, projectId: string } | null>} - An observable that emits an object containing details for modal, including the project ID if available, or null.
   */
  saveOrOverwriteRuleSet(
    resultData: ResultFromSaveRulesTableModal,
  ): Observable<{ contentTranslateKey: string; projectId: string } | null> {
    const overwrite = resultData.overwrite;
    const data$ = this.store.select(rulestToSave).pipe(filterOutNullish());
    const rulesLabels$ = this.store.select(getRulesLabels).pipe(filterOutNullish());
    const description$ = this.store.select(selectCurrentV2Tab).pipe(
      filterOutNullish(),
      map((data) => data.description),
      take(1),
    );
    const predictionConfig$ = this.store.select(getCurentTabRulesetPredictionConfig).pipe(filterOutNullish(), take(1));
    const activeAndFilteredUuids$ = this.store
      .select(selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered)
      .pipe(filterOutNullish());

    return combineLatest([data$, rulesLabels$, activeAndFilteredUuids$, description$, predictionConfig$]).pipe(
      mergeMap(([data, labels, activeRowsUuids, description, predictionConfig]) => {
        const ruleset = buildRulesetFromActiveRowsForBackend(data.table, data.meta, activeRowsUuids);
        const baseRequestBody = { ruleset, rules_labels: labels, prediction_config: predictionConfig };
        const requestBody = overwrite
          ? baseRequestBody
          : {
              ...baseRequestBody,
              name: resultData.ruleSetName,
              description: description,
              attached_to_dataset_id: data.ids.dataSetId,
            };

        const request$ = overwrite
          ? this.ruleSetApiService
              .overWriteRuleSet(data.ids.ruleSetId!, requestBody)
              .pipe(tap((res) => res && this.store.dispatch(V2TabsActions.setIsSaved({ isSaved: true }))))
          : this.ruleSetApiService.saveRuleSet(data.ids.ruleSetId!, requestBody);

        return request$.pipe(
          map((res) =>
            res && data.ids.projectId
              ? { contentTranslateKey: 'process.info_modal.title', projectId: data.ids.projectId.toString() }
              : null,
          ),
        );
      }),
    );
  }
}
