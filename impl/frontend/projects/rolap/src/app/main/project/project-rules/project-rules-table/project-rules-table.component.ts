import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Subject, Subscription, filter, lastValueFrom, map, skip, switchMap, take, takeUntil, tap } from 'rxjs';

import { faEllipsisV, faPen } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import {
  ContentReadyEvent,
  ContextMenuPreparingEvent,
  EditorPreparingEvent,
  RowPreparedEvent,
  SelectionChangedEvent,
} from 'devextreme/ui/data_grid';
import { mapKeys } from 'lodash';
import { ModalPositions, ModalService } from 'projects/rolap/src/app/common/services/modal/modal.service';
import { RowSelectService } from 'projects/rolap/src/app/common/services/row-select/row-select.service';
import { AppState, RuleTableUse, SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { labelsCompactedSelector } from 'projects/rolap/src/app/common/store/labels/labels.reducer';

import { ModalRef } from '../../../../common/services/modal/modal-ref';
import { TableInstanceService } from '../../../../common/services/table-instance/table-instance.service';
import { wasRowEdited } from '../../../../common/store/v2RulesTable/utils';
import { V2RulesTableActions } from '../../../../common/store/v2RulesTable/v2RulesTable.action';
import {
  selectCurrentV2RulesShouldGoToTheFirstPageOnSort,
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableMeta,
  selectCurrentV2RulesTableState,
} from '../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import {
  defaultDevExtremePageSizes,
  mapBackendColumnNameToTranslateValue,
  prepareDevExtremeTableState,
} from '../../../../common/utils/dataGridUtils';
import { ProblemTypes } from '../../../data-upload/utils/enums';
import { AttributeMinMaxValue } from '../../dataset/models/dataset';
import { Rule } from '../../models/ruleset';
import { DataField, Width } from '../../service/models/rules-customize-columns-api';
import { RefreshService } from '../../service/refresh.service';
import { RulesCustomizeColumnsService } from '../../service/rules-customize-columns.service';
import { ProjectRulesTableData } from './models/rules-table';
import { ProjectRulesTableEditorComponent } from './project-rules-table-editor/project-rules-table-editor.component';
import {
  RulesEditorDisplayTypes,
  RulesTableEditorModalSettings,
} from './project-rules-table-editor/types/rules-editor';
import { LabelMinMaxValuesService } from './service/label-min-max-values.service';
import { RulesTableCalculateSortValueService } from './service/rules-table-calculate-sort-value.service';
import { RulesTableContextMenuService } from './service/rules-table-context-menu.service';
import { RulesTableSelectionService } from './service/rules-table-selection.service';

@Component({
  selector: 'rolap-project-rules-table',
  templateUrl: './project-rules-table.component.html',
  styleUrls: ['./project-rules-table.component.scss'],
})
export class ProjectRulesTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() data: ProjectRulesTableData;
  @Input() ruleSetData: Rule[];
  @Output() selectedRowsEmitter = new EventEmitter<any>();

  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

  public readonly ALLOWED_PAGE_SIZES: number[] = defaultDevExtremePageSizes;
  public readonly ProblemTypes = ProblemTypes;
  public readonly ColumnWidth = Width;
  public rulesTableData: DataSource;
  public faPen = faPen;
  public faEllipse = faEllipsisV;
  public allRulesAreActive = true;
  public columnCount: number;
  public selectedRows: number[] = [];
  public isChecked = false;
  public exportCount: number | undefined;
  public firstTimeVisibleCols = [];
  public allColumns: DxiDataGridColumn[] = [];
  public dataIsReady = false;
  public isAfterViewInit = false;
  public labelMinMaxValue: AttributeMinMaxValue | null = null;
  private labelMinMaxValueSubscription: Subscription;
  private tableSelectionService: RulesTableSelectionService;
  private store: ArrayStore;
  private ngUnsubscribe: Subject<void> = new Subject();
  private loadStateSub: Subscription;

  constructor(
    private modalService: ModalService,
    private refreshService: RefreshService,
    private appStore: Store<AppState>,
    private tableInstanceService: TableInstanceService,
    private rowSelectService: RowSelectService,
    private ruleTableContextMenuService: RulesTableContextMenuService,
    private rulesCustomizeColumnsService: RulesCustomizeColumnsService,
    private rulesTableCalculateSortValueService: RulesTableCalculateSortValueService,
    private labelMinMaxValuesService: LabelMinMaxValuesService,
    private cd: ChangeDetectorRef,
  ) {
    this.tableSelectionService = new RulesTableSelectionService(() => this.getTableData());
  }

  ngOnInit(): void {
    this.observeLabelCompactState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['ruleSetData']) {
      if (this.dataIsReady && this.isAfterViewInit && this.dataGrid) {
        this.dataGrid.instance.repaint();
      }
      this.dataIsReady = false;
      this.setStore();
      this.dataIsReady = true;
    }
    const datasetIdChanged =
      changes['data'] && changes['data'].previousValue?.ids?.dataSetId !== this.data.ids?.dataSetId;
    if (datasetIdChanged && this.data.typeOfProblem === ProblemTypes.Regression) {
      this.getLabelMinMaxValue();
    }
  }

  ngAfterViewInit(): void {
    this.isAfterViewInit = true;
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.loadStateSub?.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.labelMinMaxValueSubscription?.unsubscribe();
  }

  // Load table state from store.
  public loadState = () => {
    const tableState = this.appStore.select(selectCurrentV2RulesTableState).pipe(
      map((tableStates) => {
        if (this.data.displayType === RuleTableUse.RULE_ADD_MODAL) {
          // Generate and return the state.
          // This is used in the manual select rule modal window when it's open from the manual rule generator.
          // In this situation, if the tab with the rule sets is not open, there is no table state in the store.
          return this.rulesCustomizeColumnsService.getDefaultStateForRuleAddModal(this.data.typeOfProblem);
        }
        if (this.data.displayType === RuleTableUse.RULE_COMPARISON_SECOND_TABLE) {
          return this.rulesCustomizeColumnsService.getColumnsForSecondRuleComparisonTable(this.data.typeOfProblem);
        }
        if (this.data.displayType === SubTabsNames.EXAMPLE) {
          return this.rulesCustomizeColumnsService.getColumnsForExampleSubTab(this.data.typeOfProblem);
        }

        if (tableStates) {
          return JSON.parse(tableStates);
        }
      }),
      filterOutNullish(),
      take(1),
      map((state) => this.prepareDevExtremeTableState({ ...state })),
      tap((state) => {
        this.firstTimeVisibleCols = state.columns.filter((col: any) => col.visible).map((col: any) => col.dataField);
      }),
    );

    return lastValueFrom(tableState);
  };

  public customizeColumns = (cols: DxiDataGridColumn[]) => {
    cols.forEach((c) =>
      this.rulesCustomizeColumnsService.customizeCol(
        c,
        this.data.typeOfProblem,
        this.data.displayType as any,
        this.editRow,
        this.rulesTableCalculateSortValueService.calculateSortValue(c, this.dataGrid),
        this.showNativeContextMenu,
      ),
    );
    this.allColumns = cols;
  };

  /**
   * Prevent sorting change when click on label size toggle button.
   */
  public onLabelToggleClick(event: MouseEvent) {
    event.stopPropagation();
  }

  public saveState = (eventState: any) => {
    const shouldSaveState = [SubTabsNames.RULES, SubTabsNames.RULES_COVERAGE, SubTabsNames.RULE_COMPARISON].includes(
      this.data.displayType as SubTabsNames,
    );
    if (!shouldSaveState) return;
    this.saveDevExtremeTableState(eventState);
  };

  // DevExtreme's saveState event is called when the table state is changed.
  // However, the events does not contain the current state of the table columns.
  // Page & pageSize are correct but the columns are not.
  // We need to rebuild the state from the table instance.
  // This is a workaround for the issue with the DevExtreme table state.
  private saveDevExtremeTableState(eventState: any) {
    // Timeout is needed to get the correct state of the columns
    setTimeout(() => {
      const newState = { ...eventState };
      const visibleColumns = this.dataGrid.instance.getVisibleColumns();
      const visibleDataFields = visibleColumns.map((col: any) => col.dataField);

      // Set the visible property for each column
      newState?.columns.map((col: any) => {
        col.visible = visibleDataFields.includes(col.dataField);
      });

      const tableState = JSON.stringify(newState);
      this.appStore.dispatch(V2RulesTableActions.setState({ tableState }));
    }, 100);
  }

  public onContentReady(e: ContentReadyEvent): void {
    this.columnCount = e.component.columnCount();
  }

  public prepareContextMenu(event: ContextMenuPreparingEvent): void {
    if (!this.data.settings.contextMenu || !this.data.displayType) return;
    if (event.target === 'header') return;
    const selectedRows = this.dataGrid.instance.getSelectedRowsData();
    const storeRowsUuid = new Set(selectedRows.map((devExtremeRow: any) => devExtremeRow.uuid as string));

    this.tableInstanceService.setSelectedRowsUuids(selectedRows.map((x) => x.uuid));

    const datasetText = this.data.dataSetText || '';
    event.items = this.ruleTableContextMenuService.getContextMenuItems(
      this.data.displayType,
      this.data.typeOfProblem,
      storeRowsUuid,
      {
        ruleSetId: this.data.ids.ruleSetId,
        dataSetId: this.data.ids.dataSetId,
        projectId: this.data.ids.projectId,
      },
      datasetText,
    );
  }

  public showNativeContextMenu = (e: any) => {
    const event = e.event as MouseEvent;
    const rowData = e.row.data as Record<string, unknown>;

    this.rulesCustomizeColumnsService.showNativeContextMenu(
      event,
      rowData,
      this.dataGrid,
      this.tableInstanceService,
      this.data.settings.contextMenu,
    );
  };

  public onRowPrepared(event: RowPreparedEvent) {
    if (!this.data.settings.instanceSync) return;
    this.rowSelectService.rightClickRowSelect(event);
  }

  public onEditorPreparing(e: EditorPreparingEvent) {
    if (this.data.displayType === RuleTableUse.RULE_ADD_MODAL) {
      this.tableSelectionService?.onEditorPreparing(e);
    }
  }

  public onSelectionChanged(e: SelectionChangedEvent<any, number>) {
    if (this.data.displayType !== RuleTableUse.RULE_ADD_MODAL) return;
    this.tableSelectionService.onSelectionChanged(e);
    this.dataGrid.instance
      .getDataSource()
      .store()
      .load()
      .then((allData) => {
        const selectedRows = (allData as any[]).filter((row) => this.selectedRows.includes(row.uuid));
        this.selectedRowsEmitter.emit(selectedRows);
      });
  }

  public markAllRuleSetsToCompare(event: any) {
    this.isChecked = event.value;
    this.appStore.dispatch(
      V2RulesTableActions.markAllRuleSetsToCompareInCurrentTable({ checkboxState: this.isChecked }),
    );
  }

  private getLabelMinMaxValue() {
    this.labelMinMaxValueSubscription?.unsubscribe();
    this.labelMinMaxValueSubscription = this.labelMinMaxValuesService
      .getLabelMinMaxValues(this.data.ids.dataSetId)
      .pipe(filterOutNullish())
      .subscribe((labelMinMaxValues) => {
        this.labelMinMaxValue = labelMinMaxValues;
      });
  }

  private setStore(): void {
    const tableData = this.getTableData();
    this.store = new ArrayStore({
      data: [...tableData],
      key: 'uuid',
      onRemoving: (arrayStoreKey) => {
        this.refreshService.setRefreshForAllTables(this.data.ids);
        this.appStore.dispatch(
          V2RulesTableActions.removeRowFromCurrentTable({ rowUuid: arrayStoreKey, isUserAction: true }),
        );
      },
    });

    this.rulesTableData = new DataSource({
      reshapeOnPush: true,
      store: this.store,
      paginate: true,
      onChanged: () => {
        if (!this.data.settings.showDisplayFilterRows) return;

        const filterExpr = this.dataGrid.instance.getCombinedFilter();
        const dataSource = this.dataGrid.instance.getDataSource();
        const loadOptions = dataSource.loadOptions();
        dataSource
          .store()
          .load({ filter: filterExpr, sort: loadOptions.sort, group: loadOptions.group })
          .then((filteredTable: any) => {
            const filteredRowsUuids = filteredTable.map((row: any) => row.uuid);
            this.appStore.dispatch(V2RulesTableActions.updateFilteredRowsUuids({ filteredRowsUuids }));
          });
      },
    });

    this.loadStateSub?.unsubscribe();

    // Subscribe to the current state of the rules table
    this.loadStateSub = this.appStore
      .select(selectCurrentV2RulesTable)
      .pipe(filterOutNullish(), take(1))
      .subscribe((res) => {
        // If the result is null or undefined, exit early
        if (!res! || !this.dataGrid) return;
        this.dataGrid.showColumnHeaders = false;
        this.loadState().then((state) => {
          if (state && this.dataGrid) {
            this.dataGrid.instance.state(state);
            this.dataGrid.instance.refresh();
            this.dataGrid.showColumnHeaders = true;
          }
        });
      });
  }

  /**
   * Returns ruleSet data.
   * When the rulesUuidsToDisplay variable has value,
   * the function returns only the rules with UUIDs stored in the rulesUuidsToDisplay variable.
   */
  private getTableData(): { [key: string]: any }[] {
    // for regular ruleset table
    if (!this.data.rulesUuidsToDisplay && !this.data.settings.dataFromApi && this.data.v2RulesTableData) {
      return [...this.data.v2RulesTableData].map((rule: any) => this.getTableDataRule(rule));
    }

    // for ruleset to compare in compare tab
    if (this.data.settings.dataFromApi) {
      if (!this.ruleSetData) return [];
      const data = [...this.ruleSetData].map((rule, index) => this.getTableDataRule(rule, index));
      return data;
    }

    // for the example tab
    return [...this.data.v2RulesTableData].map((rule: any) => this.getTableDataRule(rule));
  }

  private getTableDataRule(rule: any, index?: number) {
    return mapKeys(
      {
        ...rule,
        visibleFilter: true,
        visible: true,
        compare: rule.compare,
        ruleName: rule.autoIncrement,
      },
      (v, k) => mapBackendColumnNameToTranslateValue(k),
    );
  }

  /**
   * The table must be repaint to set the new column widths depending on the size of the labels.
   * We skip the first event because we dont want to repaint the table when the component is initialized.
   */
  private observeLabelCompactState() {
    this.appStore
      .select(labelsCompactedSelector)
      .pipe(skip(1), takeUntil(this.ngUnsubscribe))
      .subscribe(() => this.dataGrid?.instance.repaint());
  }

  private editRow = (e: any) => {
    if (!this.data) return;

    const selectedRow = e.row.data as Record<DataField, any>;

    this.appStore
      .select(selectCurrentV2RulesTableMeta)
      .pipe(
        filterOutNullish(),
        take(1),
        switchMap((meta) => {
          const MODAL_SETTINGS: RulesTableEditorModalSettings = {
            ids: this.data.ids,
            autoIncrement: selectedRow.autoIncrement,
            uuid: selectedRow.uuid,
            selectedRow,
            decisionAttributeName: meta.decision_attribute,
            displayType: RulesEditorDisplayTypes.RULE_EDITING,
          };

          return this.modalService
            .open(
              ProjectRulesTableEditorComponent,
              'project.rules.add_new_modal.title',
              '100%',
              '100%',
              { MODAL_SETTINGS },
              {
                closeOnBackdropClick: true,
                position: ModalPositions.CENTER,
                closeOnEscapeClick: false,
              },
              {
                ruleNumber: selectedRow.autoIncrement,
              },
            )
            .pipe(
              switchMap((modalRef: ModalRef<ProjectRulesTableEditorComponent>) =>
                modalRef.getResult<any>().pipe(filter((res) => res !== undefined)),
              ),
              takeUntil(this.ngUnsubscribe),
            );
        }),
        filterOutNullish(),
        map((res) => res.ruleTableRow),
        tap((editedRow) => {
          this.appStore.dispatch(V2RulesTableActions.updateCurrentTableRow({ editedRow, isUserAction: true }));
        }),
        switchMap((editedRow) =>
          this.appStore
            .select(selectCurrentV2RulesShouldGoToTheFirstPageOnSort)
            .pipe(filterOutNullish(), take(1))
            .pipe(
              map((shouldGoToTheFirstPageOnSort) => {
                let wasEdited = false;
                this.data.v2RulesTableData.forEach((row: any) => {
                  if (row.uuid === editedRow.uuid && wasRowEdited(editedRow, row)) {
                    wasEdited = true;
                  }
                });
                return { editedRow, shouldGoToTheFirstPageOnSort, wasEdited };
              }),
            ),
        ),

        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(({ shouldGoToTheFirstPageOnSort, wasEdited }) => {
        if (shouldGoToTheFirstPageOnSort && wasEdited) {
          setTimeout(() => this.dataGrid.instance.pageIndex(0));
        }
      });
  };

  private prepareDevExtremeTableState = (obj: any) => {
    const preparedState = prepareDevExtremeTableState(obj);
    // If the table displays only the rules with the given UUIDs, we need to remove "selectedRowKeys" from the DevExtreme state object.
    // When there is uuid in selectedRowKeys that is not in the table, the table will not display headers ;c
    if (this.data.rulesUuidsToDisplay) {
      preparedState.selectedRowKeys = [];
    }
    return preparedState;
  };
}
