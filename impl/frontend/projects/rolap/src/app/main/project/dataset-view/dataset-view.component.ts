import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';
import { isEqual } from 'lodash';

import { DatasetViewTableComponent } from '../../../common/components/data-grid/dataset-view-table/dataset-view-table.component';
import { DatasetViewTableType } from '../../../common/components/data-grid/dataset-view-table/types';
import { AppState } from '../../../common/store/app-state.model';
import { Ids, getCurrentStatistic } from '../../../common/store/ruleSets/rulesets.selectors';
import { selectCurrentV2TabIds } from '../../../common/store/v2Tabs/v2Tabs.selectors';

@Component({
  selector: 'rolap-dataset-view',
  templateUrl: './dataset-view.component.html',
  styleUrls: ['./dataset-view.component.scss'],
})
export class DatasetViewComponent implements OnInit {
  @ViewChild(DatasetViewTableComponent) datasetViewTableComponent: DatasetViewTableComponent;
  public ids: Ids;
  public readonly datasetViewTableType = DatasetViewTableType.DATA_SET_VIEW;
  public loading: boolean = true;

  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  public currentStatistic$ = this.store.select(getCurrentStatistic);

  private ids$ = this.store.select(selectCurrentV2TabIds).pipe(
    distinctUntilChanged(isEqual),
    filter((ids) => !!ids?.dataSetId),
    takeUntilDestroyed(this.destroyRef),
  );

  public cards$ = this.ids$.pipe(
    switchMap(() => {
      return this.currentStatistic$.pipe(
        map((currentStatistics) => {
          if (currentStatistics && currentStatistics.summary) return { summary: currentStatistics.summary };
          return { summary: undefined };
        }),
      );
    }),
    shareReplay(1),
    takeUntilDestroyed(this.destroyRef),
  );

  public summary$ = this.cards$.pipe(
    map((card) => {
      return card.summary;
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  ngOnInit(): void {
    this.ids$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ids) => {
      this.ids = ids;
    });
  }

  public handleLoading(loading: boolean): void {
    this.loading = loading;
  }
}
