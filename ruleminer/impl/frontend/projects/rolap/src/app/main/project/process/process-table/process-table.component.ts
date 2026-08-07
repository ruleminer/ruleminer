import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DxDataGridComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { RowClickEvent } from 'devextreme/ui/data_grid';
import { RowType } from 'projects/rolap/src/app/common/interfaces/table.model';
import { ProcessService } from 'projects/rolap/src/app/common/services/processes/process.service';

import { defaultDevExtremePageSizes } from '../../../../common/utils/dataGridUtils';
import { FilterDataSource, ProcessStatus, ProcessType } from '../models/process.model';
import { selectTreeDataRefreshTrigger } from '../../../../common/store/project/project.selectors';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../common/store/app-state.model';
import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { ProcessApiResponse } from '../../models/project';

type ProcessTableType = 'active' | 'ended';

@Component({
  selector: 'rolap-process-table',
  templateUrl: './process-table.component.html',
  styleUrls: ['./process-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessTableComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

  @Input() type: ProcessTableType;
  @Input() projectId: number;
  public allowedPageSizes = defaultDevExtremePageSizes;
  public dataSource: DataSource;
  private responseData$ = new BehaviorSubject<ProcessApiResponse | null>(null);

  public isRefreshing = false;
  public typeFilterDataSource: FilterDataSource[];
  public statusFilterDataSource: FilterDataSource[];

  public typeFilter: string[] = [];
  public statusFilter: string[] = [];
  public defaultStatusFilter: string[];

  private previouslyExpandedTaskId: number;
  private processStatus = ProcessStatus;
  private processType = ProcessType;

  private destroyRef = inject(DestroyRef);
  private processService = inject(ProcessService);
  private translate = inject(TranslateService);
  private store = inject(Store<AppState>);

  ngOnInit(): void {
    this.defaultStatusFilter =
      this.type === 'active'
        ? [this.processStatus.pending, this.processStatus.started, this.processStatus.stopping]
        : [
          this.processStatus.success,
          this.processStatus.failure,
          this.processStatus.aborted,
          this.processStatus.stopped,
        ];

    this.initializeDataSource();
    this.autoRefreshObserver();
  }

  public onRowClick(event: RowClickEvent) {
    if (event.rowType === RowType.DETAIL) return;

    const rowKeys = event.key;

    if (this.previouslyExpandedTaskId !== rowKeys || !event.isExpanded) {
      event.component.collapseAll(-1);
      setTimeout(() => {
        event.component.expandRow(rowKeys);
      }, 50);
    } else {
      event.component.deselectRows(rowKeys);
    }

    this.previouslyExpandedTaskId = rowKeys;
  }

  private autoRefreshObserver() {
    this.store.select(selectTreeDataRefreshTrigger)
      .pipe(
        filterOutNullish(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.dataSource.reload();
      });
  }

  private initializeDataSource() {
    this.dataSource = new DataSource({
      key: 'task_id',
      load: async (loadOptions: any) => {
        let sorting: string | null;
        this.isRefreshing = true;
        this.clearFilter();
        if (loadOptions.sort) {
          const key = loadOptions.sort[0].selector;
          const sortDirection = loadOptions.sort[0].desc ? '-' : '';

          sorting = sortDirection + key;
        } else {
          sorting = null;
        }

        if (loadOptions.filter) {
          this.getFilterOptions();
        }

        if (!this.statusFilter.length) {
          this.statusFilter = this.defaultStatusFilter;
        }

        return firstValueFrom(
          this.processService.getProcessList(
            this.projectId,
            this.statusFilter.join(','),
            this.typeFilter.join(','),
            loadOptions.take,
            loadOptions.skip,
            sorting,
          ),
        ).then((res) => {
          this.responseData$.next(res)
          this.setFilterDataSource();
          this.isRefreshing = false;
          return {
            data: res.results,
            totalCount: res.count,
          };
        });
      },
    });


  }

  private setFilterDataSource() {
    this.typeFilterDataSource = [
      { text: this.translate.instant('process.table.type.cross_validation'), value: this.processType.crossValidation },
      { text: this.translate.instant('process.table.type.ruleset'), value: this.processType.learning },
      { text: this.translate.instant('process.table.type.report'), value: this.processType.report },
      { text: this.translate.instant('process.table.type.save_ruleset'), value: this.processType.saveRuleset },
    ];

    if (this.type === 'active') {
      this.statusFilterDataSource = [
        { text: this.translate.instant('process.table.status.started'), value: this.processStatus.started },
        { text: this.translate.instant('process.table.status.pending'), value: this.processStatus.pending },
        { text: this.translate.instant('process.table.status.stopping'), value: this.processStatus.stopping },
      ];
    } else {
      this.statusFilterDataSource = [
        { text: this.translate.instant('process.table.status.success'), value: this.processStatus.success },
        { text: this.translate.instant('process.table.status.aborted'), value: this.processStatus.aborted },
        { text: this.translate.instant('process.table.status.failure'), value: this.processStatus.failure },
        { text: this.translate.instant('process.table.status.stopped'), value: this.processStatus.stopped },
      ];
    }
  }

  private getFilterOptions() {
    const filters = this.dataGrid.instance.getCombinedFilter(true);
    this.getColumnFilter(filters);
  }

  private getFilter(filter: any) {
    const columnName = filter[0];
    const filterValue = filter[2];

    if (columnName === 'type') {
      this.typeFilter.push(filterValue);
    } else {
      this.statusFilter.push(filterValue);
    }
  }

  private getColumnFilter(filters: any) {
    if (!filters['columnIndex']) {
      filters = filters.filter((x: any) => Array.isArray(x));
      filters.forEach((filter: any) => this.getColumnFilter(filter));

      return;
    }

    this.getFilter(filters);
  }

  private clearFilter() {
    this.statusFilter = [];
    this.typeFilter = [];
  }
}
