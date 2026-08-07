import { Injectable, inject } from '@angular/core';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  filter,
  lastValueFrom,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';

import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';
import { isEqual } from 'lodash';

import { AppState, RefreshAllState, refreshAll } from '../../../common/store/app-state.model';
import { activeProjectProblemTypeSelector } from '../../../common/store/project/project.selectors';
import {
  loadPredictionIndicators,
  loadRuleAttributesAndConditionImportance,
  loadRulePredictionIndicators,
  loadRuleQuantitativeCharacteristics,
  predictionIndicatorsRefreshAllChange,
  predictionIndicatorsTestDataRefresh,
  predictionIndicatorsTrainingDataRefresh,
  ruleSetImportanceRefreshChange,
  ruleSetPredictionIndicatorsRefreshChange,
  ruleSetQuantitativeCharacteristicsRefreshChange,
  rulesRefreshAllChange,
} from '../../../common/store/ruleSets/rulesets.action';
import { Ids } from '../../../common/store/ruleSets/rulesets.selectors';
import { getCurentTabRulesetPredictionConfig } from '../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';
import { V2PredictionQualityTabActions } from '../../../common/store/v2PredictionQualityTab/v2PredictionQualityTab.action';
import { V2RulesTableData, V2RulesTableMeta } from '../../../common/store/v2RulesTable/types';
import { V2RulesTableActions } from '../../../common/store/v2RulesTable/v2RulesTable.action';
import {
  selectCurrentV2RulesTableCoverage,
  selectCurrentV2RulesTableCoverageNeedsRefetch,
  selectCurrentV2RulesTableData,
  selectCurrentV2RulesTableMeta,
  selectCurrentV2RulesTableRulesWithOutdatedCoverages,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
} from '../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { V2TabsActions } from '../../../common/store/v2Tabs/v2Tabs.action';
import { selectCurrentV2TabIds } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { convertRulesBigTableForBackend, getActiveRows } from '../../data-upload/utils/utils';
import { ProjectService } from './project.service';

/**
 * TODO: REWRITE THIS IN EFFECTS
 * Refresh service is used to recalculate data by sending requests to backend. After that it updates store.
 * It is used for all tables that have refresh button.
 */
@Injectable({
  providedIn: 'root',
})
export class RefreshService {
  private store = inject(Store<AppState>);
  private projectService = inject(ProjectService);

  public async updateAllRulesTabData(ids: Ids): Promise<void> {
    if (!ids || !ids.ruleSetId) return;
    try {
      this.store.dispatch(rulesRefreshAllChange({ ids, refreshAll: RefreshAllState.PROCESSING_DATA }));

      // First, refresh rules table to ensure we have the complete data with coverage
      await this.refreshRulesTable(null);

      // Get the updated table data after rules table refresh
      const table = await this.getTableData();

      // Then refresh all other indicators in parallel
      await Promise.all([
        this.refreshPredictionIndicators(table, null, ids),
        this.refreshQuantitativeCharacteristics(table, null, ids),
        this.refreshImportance(table, null, ids),
      ]);

      this.store.dispatch(rulesRefreshAllChange({ ids, refreshAll: RefreshAllState.SUCCESS }));
    } catch {
      this.store.dispatch(rulesRefreshAllChange({ ids, refreshAll: RefreshAllState.CLICKABLE }));
    }
  }

  /**
   * Special method for refreshing data after adding new rules.
   * Ensures that all coverage data is properly calculated for new rules.
   */
  public async updateAllRulesTabDataForNewRules(ids: Ids): Promise<void> {
    if (!ids || !ids.ruleSetId) return;
    try {
      this.store.dispatch(rulesRefreshAllChange({ ids, refreshAll: RefreshAllState.PROCESSING_DATA }));

      // Force refresh of coverage data for all rules (including new ones)
      this.store.dispatch(V2RulesTableActions.setCoverageNeedsRefetchForCurrentTab({ needsRefetch: true }));

      // First, refresh rules table to ensure we have the complete data with coverage
      await this.refreshRulesTable(null);

      // Get the updated table data after rules table refresh
      const table = await this.getTableData();

      // Then refresh all other indicators in parallel
      await Promise.all([
        this.refreshPredictionIndicators(table, null, ids),
        this.refreshQuantitativeCharacteristics(table, null, ids),
        this.refreshImportance(table, null, ids),
      ]);

      this.store.dispatch(rulesRefreshAllChange({ ids, refreshAll: RefreshAllState.SUCCESS }));
    } catch {
      this.store.dispatch(rulesRefreshAllChange({ ids, refreshAll: RefreshAllState.CLICKABLE }));
    }
  }

  //Refresh big table
  public async refreshRulesTable(instance: DxDataGridComponent['instance'] | null = null) {
    try {
      const meta = await lastValueFrom(
        this.store.select(selectCurrentV2RulesTableMeta).pipe(filterOutNullish(), take(1)),
      );

      const tableData = await lastValueFrom(
        this.store.select(selectCurrentV2RulesTableData).pipe(filterOutNullish(), take(1)),
      );
      const ids = await lastValueFrom(this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish(), take(1)));
      const activeAndFilteredRowsUuids = await lastValueFrom(
        this.store.select(selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered).pipe(filterOutNullish(), take(1)),
      );

      const ruleset = {
        meta,
        rules: this.convertDataForRulesCoverage([...tableData], activeAndFilteredRowsUuids),
      };
      const rulesCoverage$ = this.getGlobalRulesCoverage(ids, ruleset).pipe(take(1));
      const rulesCoverage = await lastValueFrom(rulesCoverage$);
      const data: any = {
        ruleset,
        rule_coverage: rulesCoverage!,
      };
      instance?.beginCustomLoading('');

      const refreshedData = await lastValueFrom(
        this.projectService.getRulesIndicatorsWithCoverage(ids!, data, tableData),
      );
      this.store.dispatch(V2RulesTableActions.setTableDataForCurrent({ data: refreshedData, ids: ids! }));
      instance?.endCustomLoading();
      return Promise.resolve();
    } catch (err: any) {
      instance?.endCustomLoading();
      return Promise.reject(err);
    }
  }

  public refreshPredictionIndicators = this.refreshTableFn(
    true,
    ruleSetPredictionIndicatorsRefreshChange,
    'putPredictionIndicatorsMapped',
    loadRulePredictionIndicators,
  );
  public refreshQuantitativeCharacteristics = this.refreshTableFn(
    true,
    ruleSetQuantitativeCharacteristicsRefreshChange,
    'putQuantitativeCharacteristics',
    loadRuleQuantitativeCharacteristics,
  );
  public refreshImportance = this.refreshTableFn(
    true,
    ruleSetImportanceRefreshChange,
    'putImportance',
    loadRuleAttributesAndConditionImportance,
  );
  public refreshPredictionTrainingData = this.refreshTableFn(
    true,
    predictionIndicatorsTrainingDataRefresh,
    'putPredictionIndicators',
    null,
    (payload: { data: any; ids: Ids }) =>
      V2PredictionQualityTabActions.recalculateGeneralIndicators({ data: payload.data.general, ids: payload.ids }),
    (payload: { data: any; ids: Ids }) =>
      loadPredictionIndicators({ data: payload.data.for_classes, ids: payload.ids }),
  );

  private refreshTableFn(
    includeOrginalRuleSetId: boolean,
    ruleSetRefreshAction: Function,
    projectServiceMethod: string,
    updateTableAction: Function | null,
    ...otherActions: Function[]
  ) {
    return async (
      tableData: V2RulesTableData,
      instance: DxDataGridComponent['instance'] | null = null,
      ids: Ids,
    ): Promise<any> => {
      if (!ids.projectId || !ids.dataSetId || !ids.ruleSetId) return;

      try {
        const meta = await lastValueFrom(
          this.store.select(selectCurrentV2RulesTableMeta).pipe(filterOutNullish(), take(1)),
        );
        const activeAndFilteredRowsUuids = await lastValueFrom(
          this.store.select(selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered).pipe(filterOutNullish(), take(1)),
        );
        const problemType = await lastValueFrom(
          this.store.select(activeProjectProblemTypeSelector).pipe(filterOutNullish(), take(1)),
        );
        const ruleset = {
          meta,
          rules: this.convertDataForRulesCoverage([...tableData], activeAndFilteredRowsUuids),
        };
        const rulesCoverage$ = this.getGlobalRulesCoverage(ids, ruleset).pipe(take(1));
        const rulesCoverage = await lastValueFrom(rulesCoverage$);
        const prediction_config = await lastValueFrom(
          this.store.select(getCurentTabRulesetPredictionConfig).pipe(filterOutNullish(), take(1)),
        );

        const data: any = {
          ruleset,
          rule_coverage: rulesCoverage,
          ...(includeOrginalRuleSetId && { original_ruleset_id: ids.ruleSetId }),
          ...((projectServiceMethod === 'putPredictionIndicators' ||
            projectServiceMethod === 'putPredictionIndicatorsMapped') && {
            prediction_config,
          }),
        };

        instance?.beginCustomLoading('');
        const refreshedData: any =
          projectServiceMethod === 'putQuantitativeCharacteristics' || projectServiceMethod === 'importance'
            ? await lastValueFrom((this.projectService as any)[projectServiceMethod](ids, data, tableData, problemType))
            : await lastValueFrom((this.projectService as any)[projectServiceMethod](ids, data, tableData));

        if (updateTableAction) {
          this.store.dispatch(updateTableAction({ data: refreshedData, ids }));
        }

        otherActions.forEach((action) => {
          this.store.dispatch(action({ data: refreshedData, ids }));
        });
        instance?.endCustomLoading();

        const successDispatch = { ids, refresh: false, needsRefresh: false };
        this.store.dispatch(ruleSetRefreshAction(successDispatch));
      } catch (err: any) {
        instance?.endCustomLoading();
        const refreshDispatch = { ids, refresh: true, needsRefresh: true };
        this.store.dispatch(ruleSetRefreshAction(refreshDispatch));
        return Promise.reject(err);
      }
    };
  }

  public calculateLocalExplainability(
    tableData: V2RulesTableData,
    tableMeta: V2RulesTableMeta,
    activeAndFilteredRowsUuids: string[],
    examples: any,
    projectId: number,
    dataSetId: number,
    ruleSetId: number,
  ): Observable<any> {
    const rulesCoverageBody = {
      meta: tableMeta,
      rules: this.convertDataForRulesCoverage([...tableData], activeAndFilteredRowsUuids),
    };
    const predictionConfig$ = this.store.select(getCurentTabRulesetPredictionConfig).pipe(filterOutNullish(), take(1));
    return combineLatest([
      this.getGlobalRulesCoverage({ dataSetId, projectId, ruleSetId }, rulesCoverageBody).pipe(take(1)),
      predictionConfig$,
    ]).pipe(
      take(1),
      switchMap(([rulesCoverage, prediction_config]) => {
        const data = {
          examples,
          original_ruleset_id: ruleSetId,
          ruleset: rulesCoverageBody,
          rule_coverage: rulesCoverage,
          prediction_config,
        };
        return this.projectService.putLocalExplainability(dataSetId, data);
      }),
    );
  }

  /** Updates predicationTab.refreshAll with refreshScope value  */
  public predictionIndicatorsRefreshAllChange(ids: Ids, refreshScope: refreshAll) {
    const dispatchData = { ids, refreshAll: refreshScope as refreshAll };
    this.store.dispatch(predictionIndicatorsRefreshAllChange(dispatchData));
  }

  //TODO zamienic metode na akcje setRefreshForAllTablesSequential
  public setRefreshForAllTables(ids: Ids) {
    const needsRefresh = true;
    const dispatchData = { ids, needsRefresh };
    if (needsRefresh) {
      this.store.dispatch(V2TabsActions.setIsSaved({ isSaved: false }));
    }
    this.store.dispatch(ruleSetPredictionIndicatorsRefreshChange(dispatchData));
    this.store.dispatch(ruleSetQuantitativeCharacteristicsRefreshChange(dispatchData));
    this.store.dispatch(ruleSetImportanceRefreshChange(dispatchData));
    const refreshAll: refreshAll = RefreshAllState.CLICKABLE;
    this.predictionIndicatorsRefreshAllChange(ids, refreshAll);
    this.store.dispatch(rulesRefreshAllChange({ ids, refreshAll }));
    this.store.dispatch(predictionIndicatorsTestDataRefresh(dispatchData));
    this.store.dispatch(predictionIndicatorsTrainingDataRefresh(dispatchData));
    this.store.dispatch(V2RulesTableActions.setCoverageNeedsRefetchForCurrentTab({ needsRefetch: true }));
  }

  public refreshDataForTestCard(selectedDataSetId: number): Observable<any> {
    const ids$ = this.store.pipe(select(selectCurrentV2TabIds)).pipe(
      distinctUntilChanged(isEqual),
      filter((ids) => !!ids?.dataSetId),
    );

    const rulesBigTable$ = combineLatest([
      ids$,
      this.store.pipe(select(selectCurrentV2RulesTableData)),
      this.store.pipe(select(selectCurrentV2RulesTableMeta)),
      this.store.pipe(select(selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered)),
      this.store.pipe(select(activeProjectProblemTypeSelector)),
    ]).pipe(
      map(([ids, v2RulesTableData, v2RulesTableMeta, activeAndFilteredRowsUuids, problemType]) => ({
        ids,
        v2RulesTableData,
        v2RulesTableMeta,
        activeAndFilteredRowsUuids,
        problemType,
      })),
    );

    return rulesBigTable$.pipe(
      take(1),
      distinctUntilChanged(isEqual),
      switchMap(({ ids, v2RulesTableData, v2RulesTableMeta, activeAndFilteredRowsUuids }) => {
        if (!v2RulesTableData || v2RulesTableData.length === 0) return of(null);

        const ruleset = {
          meta: v2RulesTableMeta,
          rules: this.convertDataForRulesCoverage([...v2RulesTableData], activeAndFilteredRowsUuids),
        };

        const rulesCoverage$ = this.projectService.putRulesCoverage(ids.dataSetId!, ruleset).pipe(
          map((rulesCoverage: any) => rulesCoverage.rule_coverage),
          take(1),
        );

        const predictionConfig$ = this.store
          .select(getCurentTabRulesetPredictionConfig)
          .pipe(filterOutNullish(), take(1));

        return combineLatest([rulesCoverage$, predictionConfig$]).pipe(
          take(1),
          switchMap(([rulesCoverage, prediction_config]) => {
            const data = {
              original_ruleset_id: ids.ruleSetId,
              ruleset,
              rule_coverage: rulesCoverage,
              prediction_config,
            };

            return this.projectService.putPredictionIndicators({ dataSetId: selectedDataSetId }, data).pipe();
          }),
        );
      }),
    );
  }

  // returns global rules coverage from store if it doesn't need refresh,
  // otherwise it sends request to backend and updates store
  public getGlobalRulesCoverage(ids: Ids, ruleset: any): Observable<any> {
    const getGlobalRulesCoverage$ = this.store.select(selectCurrentV2RulesTableCoverage).pipe(take(1));
    const rulesWithOutdatedCoverages$ = this.store
      .select(selectCurrentV2RulesTableRulesWithOutdatedCoverages)
      .pipe(take(1));
    const needsRefresh$ = this.store.select(selectCurrentV2RulesTableCoverageNeedsRefetch).pipe(take(1));
    const data$ = getGlobalRulesCoverage$.pipe(map((rulesCoverage) => rulesCoverage));

    const rulesCoverage$ = combineLatest([needsRefresh$, data$, rulesWithOutdatedCoverages$]).pipe(
      switchMap(([needsRefresh, coverages, rulesWithOutdatedCoverages]) => {
        if (!needsRefresh) {
          const missingCoverageRules = ruleset.rules.some((rule: any) => !coverages?.[rule.uuid]);
          if (missingCoverageRules) {
            return this.calculateRulesCoverage(ids, ruleset);
          }
          return of(coverages);
        }
        if (coverages === null) return this.calculateRulesCoverage(ids, ruleset);
        const filteredRuleset = {
          ...ruleset,
          rules: ruleset.rules.filter((rule: any) => {
            return rulesWithOutdatedCoverages![rule.uuid];
          }),
        };
        if (filteredRuleset.rules.length === 0) return of(coverages);
        return this.calculateRulesCoverage(ids, filteredRuleset).pipe(
          map((newRulesCoverage) => {
            return { newRulesCoverage, coverages };
          }),
        );
      }),
      switchMap((res) => {
        return this.store.select(selectCurrentV2RulesTableCoverage).pipe(
          map((rulesCoverage: any) => {
            const filteredCoverage: { [ruleUuid: string]: any } = {};
            ruleset.rules.forEach((rule: any) => {
              if (rulesCoverage[rule.uuid]) {
                filteredCoverage[rule.uuid] = rulesCoverage[rule.uuid];
              }
            });
            return filteredCoverage;
          }),
          take(1),
        );
      }),
    );
    return rulesCoverage$;
  }

  public calculateRulesCoverage(ids: Ids, ruleset: any) {
    return this.projectService.putRulesCoverage(ids.dataSetId!, ruleset).pipe(
      map((response) => response.rule_coverage),
      tap((rulesCoverageData) => {
        this.store.dispatch(V2RulesTableActions.setCoverageForCurrentTab({ coverage: rulesCoverageData }));
      }),
    );
  }

  private convertDataForRulesCoverage(data: V2RulesTableData, activeAndFilteredRowsUuids: string[]): Array<any> {
    const activeRows = getActiveRows(data, activeAndFilteredRowsUuids);
    const convertedData = convertRulesBigTableForBackend(activeRows);
    return convertedData;
  }

  private async getTableData() {
    return lastValueFrom(this.store.select(selectCurrentV2RulesTableData).pipe(filterOutNullish(), take(1)));
  }
}
