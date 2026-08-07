import { Injectable } from '@angular/core';

import { Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';

import { AppState } from '../../../../../common/store/app-state.model';
import { V2RulesTableActions } from '../../../../../common/store/v2RulesTable/v2RulesTable.action';
import { DataField } from '../../../service/models/rules-customize-columns-api';

@Injectable({
  providedIn: 'root',
})
export class RulesTableCalculateSortValueService {
  constructor(private store: Store<AppState>) {}

  /**
   * Higher-order function that returns a sorting function for a specific column.
   * Empty values are prioritized regardless of the sort order.
   *
   * @param column - The column for which the sorting function is to be created.
   * @param dataGrid - The data grid component.
   * @returns A function that determines the sort value based on the column and row data.
   */
  public calculateSortValue = (column: DxiDataGridColumn, dataGrid: DxDataGridComponent) => {
    const columnName = column.name!;
    const dataType = column.dataType!;
    if (columnName === DataField.Labels) {
      return (rowData: any) => this.calculateLabelSortValue(rowData, columnName);
    }

    if (dataType === 'number') {
      return (rowData: any) => this.calculateNumberSortValue(rowData, columnName, dataGrid);
    }

    if (columnName === DataField.DisplayConclusion) {
      return (rowData: any) => this.calculateConclusionSortValue(rowData, columnName);
    }

    return (rowData: any) => this.calculateDefaultSortValue(rowData, columnName, dataGrid);
  };

  /**
   * Custom sorting to ensure empty values are always at the top.
   * Empty values are prioritized regardless of the sort order.
   * When shouldGoToTheFirstPageOnSort is true, the grid will go to the first page on sort.
   * This is used to ensure that the grid goes to the first page after editing sorted column.
   *
   * @param rowData - The row data from the grid.
   * @param columnName - The name of the column to be sorted.
   */
  private calculateDefaultSortValue = (rowData: any, columnName: string, dataGrid: DxDataGridComponent) => {
    const value = rowData[columnName];
    if (value === null || value === undefined || value === '') {
      if (this.areAnyColumnsSorted(dataGrid)) {
        this.store.dispatch(
          V2RulesTableActions.setShouldGoToTheFirstPageOnSort({ shouldGoToTheFirstPageOnSort: false }),
        );
      }
      const dataGridInstance = dataGrid.instance;
      const columnType = dataGridInstance.columnOption(columnName, 'dataType');

      if (columnType === 'string') {
        return dataGridInstance.columnOption(columnName, 'sortOrder') === 'asc' ? 'żżż' : 'aaa';
      }
      if (columnType === 'number') {
        return dataGridInstance.columnOption(columnName, 'sortOrder') === 'asc'
          ? Number.MIN_SAFE_INTEGER
          : Number.MAX_SAFE_INTEGER;
      }
    }

    return value;
  };

  /**
   * Custom sorting for number column.
   * In addition to numbers, this column may also contain string values.
   * Strings should be taken as the largest value excluding empty values.
   *
   * @param rowData - The row data from the grid.
   * @param columnName - The name of the column to be sorted.
   * @param dataGrid - The data grid component.
   */
  private calculateNumberSortValue = (rowData: any, columnName: string, dataGrid: DxDataGridComponent) => {
    if (typeof rowData[columnName] === 'string') {
      // Minus 1 to ensure that the empty values are always at the top.
      return Number.MAX_SAFE_INTEGER - 1;
    }

    return this.calculateDefaultSortValue(rowData, columnName, dataGrid);
  };

  /**
   * Custom sorting for 'labels' column.
   * Ensures the correct sorting for labels.
   *
   * @param rowData - The row data from the grid.
   * @param columnName - The name of the column to be sorted.
   */
  private calculateLabelSortValue = (rowData: any, columnName: string) => {
    const value = rowData[columnName];
    if (value === undefined) return [];
    return value;
  };

  private calculateConclusionSortValue = (rowData: any, columnName: string) => {
    const value = rowData[columnName]?.value;
    if (value === undefined) return [];
    return value;
  };

  private areAnyColumnsSorted(dataGrid: DxDataGridComponent): boolean {
    const instance = dataGrid.instance;
    const columnCount = instance.columnCount();

    for (let i = 0; i < columnCount; i++) {
      const column = instance.columnOption(i);
      if (column.sortIndex != null) {
        return true;
      }
    }

    return false;
  }
}
