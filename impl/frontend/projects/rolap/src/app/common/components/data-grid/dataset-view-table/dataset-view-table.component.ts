import { getCurrentV2DataSetTableColumns } from './../../../store/v2DataSetTable/v2DataSetTable.selectors';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { filterOutNullish } from '../../../utils/rxjsUtils';
import { Observable, Subject, Subscription, lastValueFrom, map, take, takeUntil } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFloppyDisk } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import { LoadOptions } from 'devextreme/data';
import DataSource from 'devextreme/data/data_source';
import { CellPreparedEvent, ContextMenuPreparingEvent, SelectionChangedEvent } from 'devextreme/ui/data_grid';
import Menu from 'devextreme/ui/menu';
import { cloneDeep } from 'lodash';
import { DownloadService } from 'projects/rolap/src/app/main/project/dataset/service/download.service';
import { TreeviewRefreshService } from 'projects/rolap/src/app/main/project/dataset/treeview/service/treeview-refresh.service';

import { DatasetViewSummaryComponent } from '../../../../main/project/dataset-view/dataset-view-summary/dataset-view-summary.component';
import { RulesetSelectModalComponent } from '../../../../main/project/dataset-view/ruleset-select-modal/ruleset-select-modal/ruleset-select-modal.component';
import {
  Column,
  ContextMenuItemType,
  DataSourceLoadResult,
  DatasetAttributesRoles,
  DatasetData,
} from '../../../../main/project/dataset/models/dataset';
import { DatasetConfigService } from '../../../../main/project/dataset/service/dataset-config.service';
import { DatasetService } from '../../../../main/project/dataset/service/dataset.service';
import { DatasetCustomizeColumnsService } from '../../../../main/project/service/dataset-customize-columns.service';
import { ProjectService } from '../../../../main/project/service/project.service';
import { RowType } from '../../../interfaces/table.model';
import { ModalService } from '../../../services/modal/modal.service';
import { NotifyService } from '../../../services/notify/notify.service';
import { TableInstanceService } from '../../../services/table-instance/table-instance.service';
import { AppState, SubTabsNames } from '../../../store/app-state.model';
import { V2ClassifyCardActions } from '../../../store/v2Classify/v2Classify.action';
import { V2DataSetTableActions } from '../../../store/v2DataSetTable/v2DataSetTable.action';
import { getCurentV2DataSetTableState } from '../../../store/v2DataSetTable/v2DataSetTable.selectors';
import { V2TabsActions } from '../../../store/v2Tabs/v2Tabs.action';
import { prepareDevExtremeTableState, updateObjectKeysDotToComma } from '../../../utils/dataGridUtils';
import { DataGridComponent } from '../../../utils/exportUtils';
import { CardModule } from '../../card/card.module';
import {
  DatasetViewTableComponentSettings,
  DatasetViewTableType,
  DatasetViewTableTypeConfig,
  FilteredColumns,
} from './types';

@Component({
  selector: 'rolap-dataset-view-table',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule,
    CardModule,
    FontAwesomeModule,
    DatasetViewSummaryComponent,
  ],
  templateUrl: './dataset-view-table.component.html',
  styleUrls: ['./dataset-view-table.component.scss'],
})
export class DatasetViewTableComponent implements OnChanges, OnDestroy, DataGridComponent {
  private stateRestoredOnError = false;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  @Input({ required: true }) tableType: DatasetViewTableType;
  @Input() dataSetId: number;
  @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() loadingState: EventEmitter<boolean> = new EventEmitter<boolean>();
  public filteredCount: number;
  public dataGridReady = false;

  public settings: DatasetViewTableComponentSettings;
  public dataSource: DataSource;
  public columns: (Column & { filterOperations: string[] })[] = [];
  public faFloppyDisk = faFloppyDisk;
  public idColumnName: string = this.datasetService.ID_COLUMN_DISPLAY_NAME;
  public currentPage = 0;
  public columnCount: number;
  public exportCount: number | undefined = undefined;
  public isLoading = true;
  public noData = false;
  public loader = true;
  public specialColumns: FilteredColumns[] = [];

  protected filterCount: number;
  protected ngUnsubscribe: Subject<void> = new Subject();
  private loadStateSub: Subscription;
  public datasetViewTableType = DatasetViewTableType;

  constructor(
    protected datasetService: DatasetService,
    protected store: Store<AppState>,
    protected projectService: ProjectService,
    protected modalService: ModalService,
    protected treeViewRefreshService: TreeviewRefreshService,
    protected notifyService: NotifyService,
    protected translate: TranslateService,
    protected downloadService: DownloadService,
    protected tableInstanceService: TableInstanceService,
    private datasetConfigService: DatasetConfigService,
    protected datasetCustomizeColumnsService: DatasetCustomizeColumnsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableType']) this.setValuesByTableType();
    if (changes['dataSetId']) {
      // Only clear the columns if the dataSetId is actually changing to a new value.
      if (!changes['dataSetId'].firstChange && changes['dataSetId'].currentValue !== changes['dataSetId'].previousValue) {
        if (this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
          this.clearColumns();
        }
      }
      this.setDataSource();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadStateSub?.unsubscribe();
  }

  public onDataGridInitialized(): void {
    setTimeout(() => {
      this.dataGridReady = true;
      this.cdr.detectChanges();
    });
  }

  public getDataGrid(): DxDataGridComponent {
    return this.dataGrid;
  }

  public getTotalCount(): number {
    return this.dataSource?.totalCount() ?? 0;
  }

  public openColumnChooser(): void {
    this.dataGrid.instance.showColumnChooser();
  }

  public selectionChanged(event: SelectionChangedEvent): void {
    if (this.settings.selectionMode === 'none' || event.selectedRowsData?.length === 0) return;
    const firstSelectedRow = event.selectedRowsData[0];
    this.onSelectionChanged.emit(firstSelectedRow);
  }

  public prepareContextMenu(event: ContextMenuPreparingEvent) {
    if (!this.settings.hasContextMenu) return;
    if (event.target === 'header') return;
    if (this.filterCount === 0) return;
    const selectedRowsData = this.dataGrid.instance.getSelectedRowsData();
    const contextMenuItems = [
      {
        text: this.translate.instant('dataset.context_menu.classify'),
        onItemClick: () => {
          this.onContextMenuItemClick('classify');
        },
        disabled: selectedRowsData.length === 0,
      },
    ];

    event.items = contextMenuItems;
  }

  public onCellPrepared(event: CellPreparedEvent): void {
    if (event.rowType === RowType.FILTER) {
      const menuElement = event.cellElement.querySelector('.dx-filter-menu');
      if (menuElement) {
        const menu = <Menu>Menu.getInstance(menuElement);
        const subItems: any = menu.option('items[0].items');
        subItems[subItems.length - 1].icon = 'filter-operation-clear';
        menu.option('items[0].items', subItems);
      }
    }
  }

  public loadState = () => {
    const tableState = this.store.select(getCurentV2DataSetTableState).pipe(
      map((tableStates) => {
        if (tableStates) return JSON.parse(tableStates);
        return '';
      }),
      filterOutNullish(),
      take(1),
      map((state) => prepareDevExtremeTableState({ ...state })),
    );

    return lastValueFrom(tableState);
  };

  public saveState = (eventState: any) => {
    if (!this.dataGrid || !this.dataGrid.instance || this.tableType !== DatasetViewTableType.DATA_SET_VIEW) {
      return;
    }
    if (this.noData) return;

    const newState = { ...eventState };

    if (newState.columns && Array.isArray(newState.columns)) {
      const visibleColumns = this.dataGrid.instance.getVisibleColumns();
      const visibleDataFields = new Set(visibleColumns.map((col: any) => col.dataField));

      newState.columns.forEach((col: any) => {
        if (col && typeof col.dataField === 'string') {
          col.visible = visibleDataFields.has(col.dataField);
        }
      });
    }

    const tableState = JSON.stringify(newState);
    this.store.dispatch(V2DataSetTableActions.setState({ tableState }));
  };

  protected onContextMenuItemClick(type: ContextMenuItemType) {
    this.projectService
      .getRulesetList(this.dataSetId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res: any[]) => {
        const selectedRows = this.dataGrid.instance.getSelectedRowsData();
        selectedRows.sort((a, b) => a['#'] - b['#']);

        if (res.length === 1) {
          this.tableInstanceService.openRulesetTab(this.dataSetId, res[0].id, res[0].name);
          this.store.dispatch(V2ClassifyCardActions.addByContextMenu({ selectedRows: selectedRows }));
          this.store.dispatch(V2TabsActions.setCurrentSubTabIndexBySubTabName({ name: SubTabsNames.EXAMPLE }));
        } else {
          this.openRulesetSelectModal(res, type, selectedRows);
        }
      });
  }

  private setSpecialColumns(columns: Column[]) {
    this.specialColumns = columns
      .filter((col) => col.role === DatasetAttributesRoles.LABEL || col.role === DatasetAttributesRoles.SURVIVAL_TIME)
      .map((col) => {
        return { name: col.name, role: col.role };
      });

    this.datasetCustomizeColumnsService.setSpecialColumns(this.specialColumns);
  }

  private openRulesetSelectModal(ruleSets: any, type: ContextMenuItemType, selectedRows: any[]) {
    this.modalService.open(RulesetSelectModalComponent, 'dataset.ruleset_select_modal.title', '500px', '400px', {
      dataSetId: this.dataSetId,
      ruleSets: ruleSets,
      type: type,
      selectedRows: selectedRows,
    });
  }

  private setDataSource(): void {
    this.loader = true;
    if (this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
      // For DATA_SET_VIEW do not clear columns or reset filter state here.
      this.createDataSource();
    } else {
      // Preserve previous behavior for other table types.
      this.clearColumns();
      this.store.dispatch(
        V2DataSetTableActions.setFilterState({
          filter: undefined,
          sort: undefined,
          totalCount: 0,
        }),
      );
      this.createDataSource();
    }
  }

  protected refreshDataSource() {
    if (this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
      // A refresh should only re-trigger the data load, not reset the column definitions.
      if (this.dataSource) {
        this.dataSource.load();
      }
    } else {
      // Preserve previous behavior for other table types.
      this.clearColumns();
      this.createDataSource();
    }
  }

  private createDataSource() {
    this.dataSource = new DataSource({
      load: async (loadOptions: LoadOptions) => {
        this.isLoading = true;
        if (typeof loadOptions.take === 'number') {
          this.exportCount = loadOptions.take;
          if (this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
            const key = String(this.dataSetId);
            this.store.dispatch(V2DataSetTableActions.setExportCountComplete({ key, exportCount: loadOptions.take }));
          }
        }
        const { data, totalCount } = await this.loadData(loadOptions);
        if (this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
          this.updateSavedDataSet(loadOptions, totalCount);
        }
        this.filterCount = totalCount;
        if (this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
          this.store.dispatch(
            V2DataSetTableActions.setFilteredCount({
              filteredCount: this.filteredCount,
            }),
          );
        }
        return { data, totalCount };
      },
      paginate: true,
      pageSize: this.settings.pageSize,
    });

    this.loadStateSub?.unsubscribe();
    if (this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
      this.loadStateSub = this.store
        .select(getCurentV2DataSetTableState)
        .pipe(filterOutNullish(), take(1))
        .subscribe((res) => {
          if (!res || !this.dataGrid || this.noData) return;
          this.dataGrid.showColumnHeaders = false;
          this.loadState().then((state) => {
            if (state && this.dataGrid && this.dataGrid.instance) {
              this.dataGrid.instance.state(state);

              this.dataGrid.instance.refresh();
              this.dataGrid.showColumnHeaders = true;
            } else if (state && this.dataGrid && !this.dataGrid.instance) {
              this.dataGrid.showColumnHeaders = true;
            } else {
              this.dataGrid.showColumnHeaders = true;
            }
          });
        });
    }
  }

  private async loadData(loadOptions: LoadOptions<any>): Promise<DataSourceLoadResult> {
    this.noData = false;
    this.isLoading = true;
    if (this.loader) {
      this.loadingState.emit(true);
    }

    const offset = loadOptions.skip ?? 0;
    const limit = loadOptions.take ?? this.settings.pageSize;
    const sort = (loadOptions.sort as any) ?? undefined;
    const filter = loadOptions.filter ?? undefined;

    try {
      const response = await lastValueFrom(this.fetchData(limit, offset, sort, filter));
      this.stateRestoredOnError = false;
      this.loader = false;
      this.setSpecialColumns(response.columns);
      this.filterCount = response.count;
      this.filteredCount = this.filterCount;
      if (this.columns.length === 0) {
        this.initColumns(response.columns);
      }
      if (response.records.length === 0 && response.count === 0) this.noData = true;
      if (response.records.length > 0) { this.noData = false; }
      return this.handleServiceResponse(response);
    } catch (error) {
      if (this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
        this.store.select(getCurrentV2DataSetTableColumns).pipe(take(1)).subscribe((columns) => {
          if (!this.stateRestoredOnError && this.dataGrid) {
            this.stateRestoredOnError = true;
            this.dataGrid.showColumnHeaders = false;
            this.loadState().then((state) => {
              if (state && this.dataGrid && this.dataGrid.instance) {
                // Overwrite column filterOperations and dataType from error store columns
                if (Array.isArray(state.columns) && Array.isArray(columns)) {
                  const columnsByName = new Map();
                  for (const col of columns) {
                    if (col && col.name) columnsByName.set(col.name, col);
                  }
                  const arraysEqual = (a: any[], b: any[]) =>
                    Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
                state.columns = state.columns.map((col: any) => {
                  const storeCol = columnsByName.get(col.name || col.dataField);
                  if (storeCol) {
                    let dataType = col.dataType;
                    if (arraysEqual(storeCol.filterOperations, this.settings.numericalFilterOperations)) {
                      dataType = 'number';
                    } else if (arraysEqual(storeCol.filterOperations, this.settings.nominalFilterOperations)) {
                      dataType = 'string';
                    }
                    return {
                      ...col,
                      filterOperations: storeCol.filterOperations,
                      dataType,
                    };
                  }
                  return col;
                });
              }
              this.dataGrid.instance.state(state);
              this.dataGrid.instance.repaint();
              this.dataGrid.showColumnHeaders = true;
            } else if (state && this.dataGrid && !this.dataGrid.instance) {
              this.dataGrid.showColumnHeaders = true;
            } else {
              this.dataGrid.showColumnHeaders = true;
            }
          });
          }
        });
      }
      // Restore grid state only once per error/offline session to prevent reload loop.
      
      return this.handleFetchError();
    } finally {
      this.isLoading = false;
      this.loadingState.emit(false);
      this.cdr.detectChanges();
    }
  }

  protected fetchData(
    limit?: number,
    offset?: number,
    sort?: {
      selector: string;
      desc: boolean;
    }[],
    filter?: any,
  ): Observable<DatasetData> {
    return this.datasetService.getDataset(this.dataSetId, limit, offset, sort, filter);
  }

  protected handleServiceResponse(response: DatasetData): DataSourceLoadResult {
    if (!response) return this.handleNoContentReceived();
    const data = updateObjectKeysDotToComma(response.records);

    return {
      data,
      totalCount: response.count,
    };
  }

  public customizeColumns = (columns: DxiDataGridColumn[]) => {
    columns.forEach((column) => {
      const correspondingColumn = this.columns.find((col) => col.name === (column.dataField || column.name));
      if (correspondingColumn) {
        if (correspondingColumn.role === DatasetAttributesRoles.SURVIVAL_TIME) {
          column.filterOperations = this.settings.numericalFilterOperations;
        } else {
          column.filterOperations =
            correspondingColumn.column_type === 'num'
              ? this.settings.numericalFilterOperations
              : this.settings.nominalFilterOperations;
        }
      }
    });

    this.datasetConfigService.customizeColumns(columns, this.specialColumns, this.settings);
    const copy = cloneDeep(columns);
    if (!this.noData && this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
      this.store.dispatch(V2DataSetTableActions.setColumns({ columns: copy }));
    }
  };

  private handleNoContentReceived(): DataSourceLoadResult {
    this.notifyService.showNotify(this.translate.instant('toast_messages.errors.no_content'), 'error');
    this.noData = true;
    return { data: [], totalCount: 0 };
  }

  protected handleFetchError(): DataSourceLoadResult {
    this.noData = true;
    return { data: [], totalCount: 0 };
  }

  private updateSavedDataSet(loadOptions: LoadOptions<any>, totalCount: number): void {
    if (this.tableType !== DatasetViewTableType.DATA_SET_VIEW) return;
    const { sort, filter } = loadOptions;
    this.store.dispatch(
      V2DataSetTableActions.setFilterState({
        filter,
        sort,
        totalCount,
      }),
    );
  }

  private initColumns(columns: Column[]): void {
    const columnsWithFilterOperations = columns.map((col) => {
      const newCol = {
        ...col,
        filterOperations:
          col.column_type === 'num' ? this.settings.numericalFilterOperations : this.settings.nominalFilterOperations,
        name: col.name.replace('.', ','),
      };
      return newCol;
    });

    this.columns = columnsWithFilterOperations;
    this.columnCount = this.columns.length + 1;

    if (!this.noData && this.tableType === DatasetViewTableType.DATA_SET_VIEW) {
      this.store.dispatch(V2DataSetTableActions.setColumnsWithFilterOperations({ columnsWithFilterOperations }));
    }
  }

  protected clearColumns(): void {
    this.columns = [];
  }

  private setValuesByTableType(): void {
    const settings = DatasetViewTableTypeConfig[this.tableType];
    if (!settings) {
      throw new Error(`Configuration for table type ${this.tableType} does not exist.`);
    }

    this.settings = {
      ...settings,
      allowedPageSizes: [...settings.allowedPageSizes],
      numericalFilterOperations: [...settings.numericalFilterOperations],
      nominalFilterOperations: [...settings.nominalFilterOperations],
    };
  }

  public columnChange(event: { dataField: string; visible: boolean }): void {
    if (!this.dataGrid || !this.dataGrid.instance) return;

    this.dataGrid.instance.beginUpdate();
    const largestVisibleIndex = Math.max(
      0,
      ...(this.dataGrid.instance.getVisibleColumns().map((col) => col.visibleIndex) as number[]),
    );
    this.dataGrid.instance.columnOption(event.dataField, 'visible', event.visible);
    if (event.visible) {
      this.dataGrid.instance.columnOption(event.dataField, 'visibleIndex', largestVisibleIndex + 1);
    }
    this.dataGrid.instance.endUpdate();
  }
}