import { Component, OnDestroy, OnInit } from '@angular/core';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { Subject, distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil } from 'rxjs';

import { Store, select } from '@ngrx/store';
import { isEqual } from 'lodash';

import { AppState } from '../../../common/store/app-state.model';
import { getCurrentStatistic } from '../../../common/store/ruleSets/rulesets.selectors';
import { selectCurrentV2TabIds } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { SummaryInfo } from '../../data-upload/utils/types';
import { DatasetService } from '../dataset/service/dataset.service';

type OriginalData = {
  column_name: string;
  statistics: Array<{
    name: string;
    value: string | null;
  }>;
};

type DataType = {
  name: string;
  type: string;
};

type ResultData = {
  nominal: TransformedData[];
  numerical: TransformedData[];
};

type TransformedData = {
  attributes: string;
  [key: string]: string | number | null;
};

@Component({
  selector: 'rolap-dataset-statistics',
  templateUrl: './dataset-statistics.component.html',
  styleUrls: ['./dataset-statistics.component.scss'],
})
export class DatasetStatisticsComponent implements OnInit, OnDestroy {
  constructor(private store: Store<AppState>, private dataSetService: DatasetService) {}
  public attributes: any;
  private ngUnsubscribe = new Subject<void>();
  public currentStatistic$ = this.store.pipe(select(getCurrentStatistic));
  public summary: SummaryInfo;

  public ids$ = this.store.pipe(select(selectCurrentV2TabIds)).pipe(
    distinctUntilChanged(isEqual),
    filter((ids) => !!ids?.dataSetId),
    takeUntil(this.ngUnsubscribe),
  );

  public cards$ = this.ids$.pipe(
    switchMap(() => {
      return this.currentStatistic$.pipe(
        filterOutNullish(),
        map((currentStatistics) => {
          const { nominal, numerical } = this.transformData(currentStatistics.columns, currentStatistics.attributes);
          return { nominal, numerical, summary: currentStatistics.summary };
        }),
      );
    }),
    shareReplay(1),
    takeUntil(this.ngUnsubscribe),
  );

  public nominalCard$ = this.cards$.pipe(
    map((card) => card.nominal),
    takeUntil(this.ngUnsubscribe),
  );
  public numericalCard$ = this.cards$.pipe(
    map((card) => card.numerical),
    takeUntil(this.ngUnsubscribe),
  );

  public summaryCard$ = this.cards$.pipe(
    map((card) => card.summary),
    takeUntil(this.ngUnsubscribe),
  );

  ngOnInit() {
    this.ids$
      .pipe(
        switchMap((ids) => this.dataSetService.getNominalAttributes(ids.dataSetId)),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((attributes) => {
        this.attributes = attributes;
      });
  }

  private transformData = (originalData: OriginalData[], dataTypes: { [key: string]: DataType }): ResultData => {
    if (!originalData || originalData.length === 0) {
      return {
        nominal: [],
        numerical: [],
      };
    }

    const result: ResultData = {
      nominal: [],
      numerical: [],
    };

    originalData.forEach((column) => {
      const columnName = column.column_name;
      const dataType = Object.values(dataTypes).find((entry) => entry.name === columnName)?.type;

      if (!dataType) return;

      const transformedStat: TransformedData = {
        attributes: columnName,
      };

      column.statistics.forEach((stat: { name: string; value: string | number | null }) => {
        if (dataType === 'cat' && ['mean', 'max', 'min'].includes(stat.name)) {
          return;
        }
        if (dataType === 'num' && stat.name === 'mode') {
          return;
        }
        transformedStat[stat.name] = stat.value;
      });

      if (dataType === 'cat') {
        result.nominal.push(transformedStat);
      } else if (dataType === 'num') {
        result.numerical.push(transformedStat);
      }
    });

    return result;
  };

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
