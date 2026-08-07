import { Injectable } from '@angular/core';

import { Observable, map, switchMap, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { selectCurrentV2RulesTableLabelMinMaxValues } from 'projects/rolap/src/app/common/store/v2RulesTable/v2RulesTable.selectors';
import { V2Tab } from 'projects/rolap/src/app/common/store/v2Tabs/types';
import { isRuleSet } from 'projects/rolap/src/app/common/store/v2Tabs/utils';
import { selectCurrentV2Tab } from 'projects/rolap/src/app/common/store/v2Tabs/v2Tabs.selectors';

import { AttributeMinMaxValue, DatasetAttributesRoles } from '../../../dataset/models/dataset';
import { DatasetStatisticsColumn } from '../../../dataset/models/dataset-statistics';
import { DatasetService } from '../../../dataset/service/dataset.service';

@Injectable({
  providedIn: 'root',
})
export class LabelMinMaxValuesService {
  constructor(private store: Store<AppState>, private datasetService: DatasetService) {}

  public getLabelMinMaxValues(datasetId: number): Observable<AttributeMinMaxValue | undefined> {
    return this.store.select(selectCurrentV2Tab).pipe(
      take(1),
      switchMap((tab: V2Tab | null | undefined) => {
        const isRuleSetTab = tab?.type && isRuleSet(tab?.type);
        const currentDatasetId: number | undefined = tab?.ids?.dataSetId;
        if (!isRuleSetTab || currentDatasetId !== datasetId) {
          return this.getLabelMinMaxValuesFromApi(datasetId);
        } else {
          return this.getLabelMinMaxValuesFromStore();
        }
      }),
    );
  }

  private getLabelMinMaxValuesFromApi(datasetId: number): Observable<AttributeMinMaxValue> {
    return this.datasetService.getDatasetStatistic(datasetId).pipe(
      map((statistics) => {
        const labelStatistics: DatasetStatisticsColumn | undefined = statistics.columns.find(
          (attributeStatistics: DatasetStatisticsColumn) =>
            attributeStatistics.column_role === DatasetAttributesRoles.LABEL,
        );
        if (!labelStatistics) throw new Error('Label column not found in dataset attributes statistics');
        const labelMinMaxValue: AttributeMinMaxValue =
          this.datasetService.getMinMaxFromAttributesStatistics(labelStatistics);
        return labelMinMaxValue;
      }),
    );
  }

  private getLabelMinMaxValuesFromStore(): Observable<AttributeMinMaxValue | undefined> {
    return this.store.select(selectCurrentV2RulesTableLabelMinMaxValues).pipe(take(1));
  }
}
