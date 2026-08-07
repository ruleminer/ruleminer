import { Component, Input, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';

import { Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import DataSource from 'devextreme/data/data_source';

import { AppState, Tabs } from '../../../../../common/store/app-state.model';
import {
  ruleSetAttributesImportanceStateChange,
  ruleSetConditionImportanceStateChange,
} from '../../../../../common/store/ruleSets/rulesets.action';
import { defaultDevExtremePageSizes, dispatchTableState } from '../../../../../common/utils/dataGridUtils';
import { ProblemTypes } from '../../../../data-upload/utils/enums';

type OriginalObject = { [key: string]: { [condition: string]: number } | number };
type ConditionTableEntry = { 'condition name': string; importance: number | string };
type ConvertedEntry = { title?: string; table: ConditionTableEntry[] };
type ConvertedArray = ConvertedEntry[];

@Component({
  selector: 'rolap-project-rules-importance-table',
  templateUrl: './project-rules-importance-table.component.html',
  styleUrls: ['./project-rules-importance-table.component.scss'],
})
export class ProjectRulesImportanceTableComponent implements OnChanges {
  @Input() table: any;
  @Input() tab: Tabs;
  @Input() state: any;
  @Input() ruleSetId: number;
  @Input() dataSetId: number;
  @Input() projectId: number;
  @Input() typeOfProblem: ProblemTypes;
  @Input() isRefreshing: boolean;
  @Input() importanceType: 'condition' | 'attribute';
  @ViewChildren(DxDataGridComponent) dataGrids: QueryList<DxDataGridComponent>;
  public readonly ProblemTypes = ProblemTypes;
  public dataSource: DataSource<any, keyof any>;
  public tableData: ConvertedArray;
  public pageSize = 5;
  public currentPage = 0;
  public allowedPageSizes: number[] = defaultDevExtremePageSizes;
  public largestTableIndex = 0;
  public height = '39px';
  public importanceSorting: string | undefined;
  private importanceDispatchMap = {
    condition: (data: { v2TabId: string; state: any }) =>
      this.store.dispatch(ruleSetConditionImportanceStateChange(data)),
    attribute: (data: { v2TabId: string; state: any }) =>
      this.store.dispatch(ruleSetAttributesImportanceStateChange(data)),
  };
  public isLoading: boolean;

  constructor(private store: Store<AppState>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['table']) this.handeleTableChange();
    if (changes['isRefreshing']) this.handleIsRefreshingChange(changes['isRefreshing'].currentValue);
    if (changes['typeOfProblem']) this.handleTypeOfProblemChange(changes['typeOfProblem'].currentValue);
  }

  public onOptionChanged($event: any) {
    if (!this.dataGrids || this.dataGrids.length === 0) return;

    const dataGridInstance = this.dataGrids.last.instance;
    const dispatchFunction = this.importanceDispatchMap[this.importanceType];
    if (!dispatchFunction) return;

    const v2TabId = this.tab.id;
    dispatchTableState($event, dataGridInstance, v2TabId, dispatchFunction);

    if ($event.fullName === 'paging.pageIndex') {
      this.currentPage = $event.value;
      this.dataGrids.forEach((dataGrid) => dataGrid.instance.pageIndex(this.currentPage));
    }

    if ($event.fullName === 'paging.pageSize') {
      this.pageSize = $event.value;
      this.dataGrids.forEach((dataGrid) => dataGrid.instance.pageSize(this.pageSize));
    }
  }

  public customizeColumns = (columns: DxiDataGridColumn[]) => {
    const columnCustomizations: { [key: string]: Partial<DxiDataGridColumn> } = {
      'condition name': {
        alignment: 'right',
        allowSorting: this.typeOfProblem !== ProblemTypes.Classification,
      },
      importance: {
        alignment: 'left',
        cellTemplate: 'boldText',
        allowSorting: this.typeOfProblem !== ProblemTypes.Classification,
      },
      ordinalNumber: {
        alignment: 'right',
        allowSorting: false,
      },
    };

    columns.forEach((column) => {
      if (!column.dataField) return;
      const customization = columnCustomizations[column.dataField];
      if (customization) Object.assign(column, customization);
    });
  };

  private setStore(): void {
    this.setIsLoading();
    this.tableData = this.convertObjectToArray(this.table);
    this.findLargestTableIndex();
  }

  private setCurrentPageFromState(): void {
    this.currentPage = this.state?.pageIndex ?? 0;
  }

  private setPageSizeFromState(): void {
    this.pageSize = this.state?.pageSize ?? 5;
  }

  private convertObjectToArray(inputObj: OriginalObject): ConvertedArray {
    if (this.typeOfProblem === ProblemTypes.Classification) {
      return this.convertForClassificationProblem(inputObj);
    }
    return this.convertForNonClassificationProblem(inputObj);
  }

  private convertForClassificationProblem(inputObj: OriginalObject): ConvertedArray {
    const keys = Object.keys(inputObj);

    let maxSize = 0;
    keys.forEach((title) => {
      maxSize = Math.max(maxSize, Object.keys(inputObj[title]).length);
    });

    return keys.map((title) => {
      const conditions = Object.keys(inputObj[title]);
      const table: ConditionTableEntry[] = conditions.map((condition, index) => ({
        'condition name': condition,
        importance: (inputObj[title] as { [condition: string]: number })[condition],
        index: index,
      }));

      while (table.length < maxSize) {
        table.push({ 'condition name': ' ', importance: ' ' });
      }

      return {
        title,
        table,
      };
    });
  }

  private convertForNonClassificationProblem(inputObj: OriginalObject): ConvertedArray {
    const conditions = Object.keys(inputObj);
    const maxSize = conditions.length;
    const table: ConditionTableEntry[] = conditions.map((condition, index) => ({
      'condition name': condition,
      importance: inputObj[condition] as number,
      index: index,
    }));

    while (table.length < maxSize) {
      table.push({ 'condition name': ' ', importance: ' ' });
    }
    return [
      {
        table: table,
      },
    ];
  }

  private handeleTableChange(): void {
    this.setStore();
    this.setCurrentPageFromState();
    this.setPageSizeFromState();
  }

  private handleIsRefreshingChange(isRefreshing: boolean): void {
    if (isRefreshing) return this.beginDataGridsCustomLoading();
    this.endDataGridsCustomLoading();
  }

  private handleTypeOfProblemChange(typeOfProblem: ProblemTypes) {
    this.importanceSorting = typeOfProblem !== ProblemTypes.Classification ? 'desc' : undefined;
  }

  private beginDataGridsCustomLoading(): void {
    this.dataGrids
      ?.filter((dataGrid) => this.isValidDataGrid(dataGrid))
      .forEach((dataGrid) => dataGrid.instance.beginCustomLoading(''));
  }

  private endDataGridsCustomLoading(): void {
    this.dataGrids
      ?.filter((dataGrid) => this.isValidDataGrid(dataGrid))
      .forEach((dataGrid) => dataGrid.instance.endCustomLoading());
  }

  private isValidDataGrid(dataGrid: { instance?: any }): boolean {
    return !!(dataGrid && dataGrid.instance);
  }

  private findLargestTableIndex(): void {
    const tableLengths = this.tableData.map((table) => table.table.length);
    this.largestTableIndex = tableLengths.indexOf(Math.max(...tableLengths));
  }

  private setIsLoading(): void {
    this.isLoading = this.tab.data.rulesTab.importance.isLoading;
  }
}
