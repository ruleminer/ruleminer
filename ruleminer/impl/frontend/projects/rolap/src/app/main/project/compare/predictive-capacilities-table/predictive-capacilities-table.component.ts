import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Subject, firstValueFrom, map, switchMap, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { DxTreeViewComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { fromPairs, omit, sortBy, toPairs } from 'lodash';

import { AppState } from '../../../../common/store/app-state.model';
import { Ids } from '../../../../common/store/ruleSets/rulesets.selectors';
import { selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { defaultDevExtremePageSizes } from '../../../../common/utils/dataGridUtils';
import { DatasetService } from '../../dataset/service/dataset.service';
import { CompareApiService } from '../../service/compare-api.service';
import { PredictionIndicatorsSummaryBody } from '../../service/models/compare.model';

type SelectBoxItem = {
  id: number;
  name: string;
};

@Component({
  selector: 'rolap-predictive-capacilities-table',
  templateUrl: './predictive-capacilities-table.component.html',
  styleUrls: ['./predictive-capacilities-table.component.scss'],
})
export class PredictiveCapacilitiesTableComponent implements OnInit, OnDestroy {
  @ViewChild(DxTreeViewComponent, { static: false }) treeView: DxTreeViewComponent;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  public dataSource: DataSource;
  public dataSourceSummary: DataSource;
  public selectBoxList: SelectBoxItem[];
  public selectBoxItems: SelectBoxItem[] = [];
  public selectBoxDatasetValue: SelectBoxItem;
  public listOfMatchingDatasets: SelectBoxItem[] = [];
  public allowedPageSizes = defaultDevExtremePageSizes;
  private previouslyExpandedCompareId: number;
  private previouslyPredictiveExpandedCompareId: number;

  private ids: Ids;

  constructor(
    private store: Store<AppState>,
    private compareSelectedRowsSecondTableService: CompareApiService,
    private datasetService: DatasetService,
  ) {}

  ngOnInit() {
    this.getMatchingDatasets();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private initializeDataSource() {
    this.dataSource = new DataSource({
      load: async (loadOptions: any) => {
        let sorting: string | null;

        if (loadOptions.sort) {
          const key = loadOptions.sort[0].selector;
          const sortDirection = loadOptions.sort[0].desc ? '-' : '';

          sorting = sortDirection + key;
        } else {
          sorting = null;
        }

        const data = await firstValueFrom(
          this.compareSelectedRowsSecondTableService.getPredictiveIndicators(this.ids.dataSetId!),
        );
        this.selectBoxList = data.map((item) => {
          return { id: item.id, name: item.name };
        });
        return {
          data: data.map((item) => {
            const { id, name, indicators } = item;
            const generalData = omit(indicators.general, 'Confusion_matrix');
            const sortedData = fromPairs(sortBy(toPairs(generalData), (pair) => pair[0]));
            return { id, name, ...sortedData };
          }),
          totalCount: data.length,
        };
      },
    });
  }

  public calculateSummary() {
    const body: PredictionIndicatorsSummaryBody = {
      dataset_id: this.selectBoxDatasetValue.id,
      ruleset_ids: this.selectBoxItems.map((item) => item.id),
    };

    this.dataSourceSummary = new DataSource({
      load: async (loadOptions: any) => {
        let sorting: string | null;

        if (loadOptions.sort) {
          const key = loadOptions.sort[0].selector;
          const sortDirection = loadOptions.sort[0].desc ? '-' : '';

          sorting = sortDirection + key;
        } else {
          sorting = null;
        }

        const data = await firstValueFrom(
          this.compareSelectedRowsSecondTableService.getPredictionIndicatorsSummary(this.ids.dataSetId!, body),
        );
        return {
          data: data.map((item) => {
            const { id, name, indicators } = item;
            const generalData = omit(indicators.general, 'Confusion_matrix');
            const sortedData = fromPairs(sortBy(toPairs(generalData), (pair) => pair[0]));
            return { id, name, ...sortedData };
          }),
          totalCount: data.length,
        };
      },
    });
  }

  public onPredictiveRowClick(event: any) {
    const rowKeys = event.key;
    event.component.collapseAll(-1);

    if (this.previouslyPredictiveExpandedCompareId !== rowKeys.id || !event.isExpanded) {
      event.component.expandRow(rowKeys);
    } else {
      event.component.deselectRows(rowKeys);
    }

    this.previouslyPredictiveExpandedCompareId = rowKeys.id;
  }

  public onRowClick(event: any) {
    const rowKeys = event.key;
    event.component.collapseAll(-1);

    if (this.previouslyExpandedCompareId !== rowKeys.id || !event.isExpanded) {
      event.component.expandRow(rowKeys);
    } else {
      event.component.deselectRows(rowKeys);
    }

    this.previouslyExpandedCompareId = rowKeys.id;
  }

  private getMatchingDatasets() {
    this.store
      .select(selectCurrentV2TabIds)
      .pipe(
        filterOutNullish(),
        switchMap((ids) => {
          return this.datasetService
            .getMatchingDatasets(ids.projectId!, {
              dataset_id: ids.dataSetId!,
            })
            .pipe(
              map((datasets) => ({ datasets, ids })),
              takeUntil(this.ngUnsubscribe),
            );
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((response) => {
        const { datasets, ids } = response;
        this.ids = ids!;
        this.listOfMatchingDatasets = datasets;
        this.initializeDataSource();
      });
  }
}
