import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, firstValueFrom, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import DataSource from 'devextreme/data/data_source';

import { AppState } from '../../../../common/store/app-state.model';
import { Ids } from '../../../../common/store/ruleSets/rulesets.selectors';
import { selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { defaultDevExtremePageSizes } from '../../../../common/utils/dataGridUtils';
import { CompareApiService } from '../../service/compare-api.service';

@Component({
  selector: 'rolap-compare-table',
  templateUrl: './compare-table.component.html',
  styleUrls: ['./compare-table.component.scss'],
})
export class CompareTableComponent implements OnInit, OnDestroy {
  public ids: Ids;
  public dataSource: DataSource;
  public previouslyExpandedCompareName: string;
  public allowedPageSizes = defaultDevExtremePageSizes;
  private previouslyExpandedCompareId: number;
  private ngUnsubscribe = new Subject<void>();

  constructor(private store: Store<AppState>, private compareSelectedRowsSecondTableService: CompareApiService) {}

  ngOnInit() {
    this.store
      .select(selectCurrentV2TabIds)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((ids) => {
        if (!ids) return;
        this.ids = ids;
        this.initializeDataSource();
      });
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
          this.compareSelectedRowsSecondTableService.getPredictiveQuantitativeCharacteristics(this.ids.dataSetId!),
        );

        return {
          data: data,
          totalCount: data.length,
        };
      },
    });
  }

  public onRowClick(event: any) {
    const rowKeys = event.key;
    event.component.collapseAll(-1);

    if (this.previouslyExpandedCompareId !== rowKeys.id || !event.isExpanded) {
      event.component.expandRow(rowKeys);
    } else {
      event.component.deselectRows(rowKeys);
    }
    this.previouslyExpandedCompareName = rowKeys.name;
    this.previouslyExpandedCompareId = rowKeys.id;
  }
}
