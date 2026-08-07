import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';
import { lastValueFrom, map, take } from 'rxjs';

import { Store, select } from '@ngrx/store';

import { AppState, RefreshAllState, SubTabsNames } from '../../../../../common/store/app-state.model';
import {
  loadPredictionIndicatorsTestData,
  predictionIndicatorsRefreshAllChange,
  predictionIndicatorsTrainingDataRefresh,
  setSelecteDataSetForPredictionIndicatorsTestCard,
} from '../../../../../common/store/ruleSets/rulesets.action';
import { getCurentTab } from '../../../../../common/store/ruleSets/rulesets.reducer';
import { getCurrentTestCard } from '../../../../../common/store/ruleSets/rulesets.selectors';
import { selectCurrentV2RulesTableData } from '../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import {
  selectCurrentSubTabName,
  selectCurrentSubTabs,
  selectCurrentV2Tab,
  selectCurrentV2TabIds,
} from '../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { RefreshService } from '../../../service/refresh.service';

@Component({
  selector: 'rolap-current-ruleset',
  templateUrl: './current-ruleset.component.html',
  styleUrls: ['../display-currently-selected-tab.component.scss', './current-ruleset.component.scss'],
})
export class CurrentRulesetComponent {
  private store = inject(Store<AppState>);
  private refreshService = inject(RefreshService);

  public subTabs = toSignal(this.store.select(selectCurrentSubTabs));
  public tab = toSignal(this.store.select(getCurentTab()));
  public v2Tab = toSignal(this.store.select(selectCurrentV2Tab).pipe(filterOutNullish()));
  public ids = toSignal(this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish()));
  public subTabName = toSignal(this.store.select(selectCurrentSubTabName).pipe(filterOutNullish()));

  public async handleRefreshAll(): Promise<void> {
    const subTab = this.subTabName();
    if (!subTab) return;

    switch (subTab) {
      case SubTabsNames.PREDICTION_STATISTICS:
        await this.updateAllPredictionTabData();
        break;
      case SubTabsNames.RULES:
        const ids = this.ids();
        if (!ids) return;
        await this.refreshService.updateAllRulesTabData(ids);
        break;
    }
  }

  public async updateAllPredictionTabData(): Promise<void> {
    const ids = this.ids();
    if (!ids || !ids.ruleSetId) return;
    try {
      this.store.dispatch(predictionIndicatorsRefreshAllChange({ ids, refreshAll: RefreshAllState.PROCESSING_DATA }));
      const table = await this.getTableData();
      await this.refreshService.refreshPredictionTrainingData(table, null, ids);

      const selectedDataSet = await lastValueFrom(
        this.store.pipe(
          select(getCurrentTestCard),
          take(1),
          map((testCard) => testCard?.selectedDataSet),
        ),
      );
      const refreshDataForTestCard = await lastValueFrom(
        this.refreshService.refreshDataForTestCard(selectedDataSet).pipe(take(1)),
      );
      if (!refreshDataForTestCard) throw new Error('No refresh data');

      this.store.dispatch(setSelecteDataSetForPredictionIndicatorsTestCard({ selectedDataSet, ids }));
      this.store.dispatch(loadPredictionIndicatorsTestData({ ids, data: refreshDataForTestCard }));

      this.refreshService.predictionIndicatorsRefreshAllChange(ids, RefreshAllState.SUCCESS);
      setTimeout(() => this.refreshService.predictionIndicatorsRefreshAllChange(ids, RefreshAllState.HIDDEN), 8000);
    } catch {
      this.refreshService.predictionIndicatorsRefreshAllChange(ids, RefreshAllState.CLICKABLE);
      this.store.dispatch(predictionIndicatorsTrainingDataRefresh({ ids, needsRefresh: true }));
    }
  }

  private async getTableData() {
    return lastValueFrom(this.store.select(selectCurrentV2RulesTableData).pipe(filterOutNullish(), take(1)));
  }
}