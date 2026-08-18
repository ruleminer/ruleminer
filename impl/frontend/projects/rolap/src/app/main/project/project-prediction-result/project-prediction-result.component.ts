import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { BehaviorSubject, EMPTY, combineLatest, combineLatestWith, filter, map, pairwise, switchMap, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { ItemClickEvent } from 'devextreme/ui/select_box';

import { DatasetViewTableType } from '../../../common/components/data-grid/dataset-view-table/types';
import { PredictionResult } from '../../../common/modules/visualisation/interfaces/coverage_row';
import { AppState } from '../../../common/store/app-state.model';
import { getCurentTabRulesetPredictionConfig } from '../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';
import { V2PredictionTabActions } from '../../../common/store/v2PredictionTab/v2PredictionTab.action';
import {
  selectV2PredictionIsOutdated,
  selectV2PredictionSelectedDatasetId,
  selectV2PredictionVisibleDatasetId,
} from '../../../common/store/v2PredictionTab/v2PredictionTab.selectors';
import { TabTypes } from '../../../common/store/v2Tabs/types';
import { selectCurrentV2Tab } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { DatasetService } from '../dataset/service/dataset.service';
import { MatchingDataset } from '../models/project';

@Component({
  selector: 'rolap-project-prediction-result',
  templateUrl: './project-prediction-result.component.html',
  styleUrls: ['./project-prediction-result.component.scss'],
})
export class ProjectPredictionResultComponent implements OnInit {
  private store = inject(Store<AppState>);
  private datasetService = inject(DatasetService);
  private destroyRef = inject(DestroyRef);
  public readonly datasetViewTableType = DatasetViewTableType.RULE_SET_COVERAGE;
  public configChanged$ = new BehaviorSubject<boolean>(false);
  private datasetData = new BehaviorSubject<MatchingDataset[]>([]);
  public datasetDataObservable$ = this.datasetData.asObservable();
  public values: PredictionResult;

  public visibleDataset$ = this.store.select(selectV2PredictionVisibleDatasetId).pipe(filterOutNullish());

  public currentTab$ = this.store
    .select(selectCurrentV2Tab)
    .pipe(filterOutNullish(), takeUntilDestroyed(this.destroyRef));

  public selectedDataSet$ = this.store
    .select(selectV2PredictionSelectedDatasetId)
    .pipe(takeUntilDestroyed(this.destroyRef));
  public visibleDataSet$ = this.store
    .select(selectV2PredictionVisibleDatasetId)
    .pipe(takeUntilDestroyed(this.destroyRef));

  public combinedDatasetId$ = this.selectedDataSet$.pipe(
    combineLatestWith(this.visibleDataSet$),
    map(([selectedId, visibleId]) => visibleId || selectedId),
    filterOutNullish(),
    takeUntilDestroyed(this.destroyRef),
  );

  public isOutdated$ = combineLatest([
    this.store.select(selectV2PredictionIsOutdated).pipe(filterOutNullish()),
    this.configChanged$,
  ]).pipe(map(([isOutdated, configChanged]) => isOutdated || configChanged));

  ngOnInit(): void {
    this.store
      .select(getCurentTabRulesetPredictionConfig)
      .pipe(filterOutNullish(), pairwise(), takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        const [prevConfig, currentConfig] = config;

        if (prevConfig !== currentConfig) {
          this.configChanged$.next(true);
        }
      });

    const matchingDataset$ = this.currentTab$.pipe(
      filter((tab) => {
        return tab.type === TabTypes.RULE_SET;
      }),
      map((tab) => tab.ids),
      switchMap((ids) => {
        if (!ids) return EMPTY;
        const { projectId, dataSetId } = ids;
        if (!projectId || !dataSetId) return EMPTY;
        return this.datasetService.getMatchingDatasets(projectId, { dataset_id: dataSetId }).pipe(
          map((datasets) => ({ datasets })),
          takeUntilDestroyed(this.destroyRef),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    );

    const shouldDispatch$ = this.selectedDataSet$.pipe(
      map((selectedDataSet) => {
        if (!selectedDataSet) return true;
        return false;
      }),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    );

    matchingDataset$
      .pipe(
        combineLatestWith(shouldDispatch$),
        map(([{ datasets }, shouldDispatch]) => ({ datasets, shouldDispatch })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ datasets, shouldDispatch }) => {
        this.datasetData.next(datasets);
        if (datasets.length > 0) {
          if (shouldDispatch) {
            this.store.dispatch(V2PredictionTabActions.set({ selectedDatasetId: datasets[0].id }));
          }
        }
      });
  }

  public updateVisibleDataset(): void {
    this.store.dispatch(V2PredictionTabActions.setVisibleDataset());
    this.configChanged$.next(false);
  }

  public onDatasetClick($event: ItemClickEvent): void {
    if ($event.itemData) {
      const selectedDataSet = $event.itemData.id || null;
      this.store.dispatch(V2PredictionTabActions.updateSelectedDatasetID({ selectedDatasetId: selectedDataSet }));
    }
  }

  public handleData(data: PredictionResult) {
    this.values = data;
  }
}
