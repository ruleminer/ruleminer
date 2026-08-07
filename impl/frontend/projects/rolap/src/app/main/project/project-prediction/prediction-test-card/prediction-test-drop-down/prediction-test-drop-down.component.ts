import { Component, OnDestroy, OnInit } from '@angular/core';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  lastValueFrom,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';

import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import DataSource from 'devextreme/data/data_source';
import { ItemClickEvent, ValueChangedEvent } from 'devextreme/ui/select_box';
import { isEqual } from 'lodash';

import { NotifyService } from '../../../../../common/services/notify/notify.service';
import { AppState } from '../../../../../common/store/app-state.model';
import { selectCurrentAttributes } from '../../../../../common/store/attributes/attributes.selectors';
import {
  loadPredictionIndicatorsTestData,
  setSelecteDataSetForPredictionIndicatorsTestCard,
} from '../../../../../common/store/ruleSets/rulesets.action';
import { getCurrentTestCard } from '../../../../../common/store/ruleSets/rulesets.selectors';
import {
  selectCurrentV2RulesTableIsNumberOfFilteredRowZero,
  selectCurrentV2RulesTableMeta,
} from '../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from '../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { RefreshService } from '../../../service/refresh.service';

@Component({
  selector: 'rolap-prediction-test-drop-down',
  templateUrl: './prediction-test-drop-down.component.html',
  styleUrls: ['./prediction-test-drop-down.component.scss'],
})
export class PredictionTestDropDownComponent implements OnInit, OnDestroy {
  public isCalculating = false;
  public selectedValue: any;
  private refreshSubject = new BehaviorSubject<boolean>(false);
  refresh$ = this.refreshSubject.asObservable();
  private ngUnsubscribe = new Subject<void>();
  public ids$ = this.store.pipe(select(selectCurrentV2TabIds)).pipe(
    distinctUntilChanged(isEqual),
    filter((ids) => !!ids?.dataSetId),
    takeUntil(this.ngUnsubscribe),
  );
  private attributesFromBigTable$ = this.store.select(selectCurrentV2RulesTableMeta).pipe(
    filterOutNullish(),
    map((meta) => this.makeArrayOfAttributes(meta)),
    distinctUntilChanged(isEqual),
    shareReplay(1),
    takeUntil(this.ngUnsubscribe),
  );
  private attributesForMatchingDataSets$ = combineLatest([
    this.attributesFromBigTable$,
    this.store.select(selectCurrentAttributes).pipe(filterOutNullish()),
  ]).pipe(
    distinctUntilChanged(isEqual),
    map(([attributesFromBigTable, datasetAttributes]) => {
      return datasetAttributes
        .filter((attr: any) => attributesFromBigTable.includes(attr.name))
        .map((attr: any) => ({ name: attr.name, type: attr.type }));
    }),
    shareReplay(1),
    takeUntil(this.ngUnsubscribe),
  );

  public dropDownList$ = this.ids$.pipe(
    switchMap((ids) => {
      this.isCalculating = true;
      return this.attributesForMatchingDataSets$.pipe(
        map((attributes) => ({ attributes, projectId: ids.projectId! })),
        debounceTime(500),
        distinctUntilChanged(isEqual),
        switchMap(({ attributes, projectId }) => {
          return this.datasetService.getMatchingDatasets(projectId, { dataset_id: ids.dataSetId! });
        }),
      );
    }),
    shareReplay(1),
    takeUntil(this.ngUnsubscribe),
  );

  public dataSource$ = this.dropDownList$.pipe(
    map((array: any) => {
      return new DataSource({ store: array ? array : [] });
    }),
    tap(() => (this.isCalculating = false)),
  );
  public testCard$ = this.ids$.pipe(
    switchMap(() => this.store.pipe(select(getCurrentTestCard))),
    debounceTime(500),
    distinctUntilChanged(isEqual),
    shareReplay(1),
    takeUntil(this.ngUnsubscribe),
  );

  public selected$ = new BehaviorSubject<any>(null);

  public async onCalculateClick(): Promise<void> {
    if (this.selectedValue) {
      this.isCalculating = true;
      try {
        await this.refreshDataForTestCard(this.selectedValue);
      } finally {
        this.isCalculating = false;
      }
    }
  }

  public onSelectionChanged(e: ValueChangedEvent) {
    if (e.previousValue !== undefined) {
      this.refreshSubject.next(true);
    }
  }

  constructor(
    private store: Store<AppState>,
    private datasetService: DatasetService,
    private refreshService: RefreshService,
    private notifyService: NotifyService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.dataSource$
      .pipe(
        switchMap(() => this.dropDownList$),
        switchMap((dropDownList) =>
          this.testCard$.pipe(
            filter((testCard) => !!testCard),
            map((testCard) => this.getSelectedDataSet(testCard, dropDownList)),
          ),
        ),
        distinctUntilChanged(isEqual),
        shareReplay(1),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((selectedDataSet) => {
        if (!selectedDataSet) return;
        this.selected$.next(selectedDataSet);
        this.testCard$.subscribe(async (testCard) => {
          if (testCard.data === null) {
            await this.refreshDataForTestCard(selectedDataSet);
          }
        });
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private async refreshDataForTestCard(selectedDataSet: number, $event?: ItemClickEvent): Promise<void> {
    const oldSelectedDataSet = await lastValueFrom(this.selected$.pipe(take(1), takeUntil(this.ngUnsubscribe)));
    const ids = await lastValueFrom(
      this.ids$.pipe(
        take(1),
        filter((ids) => !!ids),
        takeUntil(this.ngUnsubscribe),
      ),
    );
    try {
      const { refreshDataForTestCard } = await lastValueFrom(
        this.refreshService
          .refreshDataForTestCard(selectedDataSet)
          .pipe(map((refreshDataForTestCard) => ({ refreshDataForTestCard, ids }))),
      );
      if (refreshDataForTestCard) {
        this.store.dispatch(loadPredictionIndicatorsTestData({ ids, data: refreshDataForTestCard }));
        this.store.dispatch(setSelecteDataSetForPredictionIndicatorsTestCard({ selectedDataSet, ids }));
      } else {
        throw new Error('refreshDataForTestCard is null');
      }
      this.refreshSubject.next(false);
    } catch (error) {
      this.store.dispatch(
        setSelecteDataSetForPredictionIndicatorsTestCard({ selectedDataSet: oldSelectedDataSet, ids }),
      );
      this.selected$.next(oldSelectedDataSet);
      if ($event && $event.component) {
        $event.component.option('value', oldSelectedDataSet);
      }
      const isNumberOfFilteredRowsZero = await lastValueFrom(
        this.store.select(selectCurrentV2RulesTableIsNumberOfFilteredRowZero).pipe(take(1)),
      );
      if (isNumberOfFilteredRowsZero) {
        return;
      }
      this.notifyService.showNotify(this.translate.instant('toast_messages.errors.test_data_set_change'), 'error');
    }
  }

  private makeArrayOfAttributes(meta: any): any[] {
    const attributes = meta?.attributes || [];
    const decisionAttribute = meta?.decision_attribute;
    return decisionAttribute ? [...attributes, decisionAttribute] : attributes;
  }

  private getSelectedDataSet(testCard: any, array: any[]): any {
    if (testCard?.selectedDataSet) {
      return testCard.selectedDataSet;
    }
    if (array?.length > 0 && array[0]?.id) {
      return array[0].id;
    }
    return undefined;
  }
}
