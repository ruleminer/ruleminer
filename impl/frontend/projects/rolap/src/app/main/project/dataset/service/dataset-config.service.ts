import { Injectable } from '@angular/core';

import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';

import {
  DatasetViewTableComponentSettings,
  FilteredColumns,
} from '../../../../common/components/data-grid/dataset-view-table/types';
import { DatasetAttributesRoles } from '../models/dataset';

@Injectable({
  providedIn: 'root',
})
export class DatasetConfigService {
  isSpecialColumn(columnName: string, specialColumns: FilteredColumns[]): boolean {
    return specialColumns.some((specialCol) => specialCol.name === columnName);
  }

  getAllowHiding(columnToCheck: DxiDataGridColumn, specialColumns: FilteredColumns[]): boolean {
    const columnName = columnToCheck.name || '';
    if (columnName === '#') {
      return false;
    }
    return !this.isSpecialColumn(columnName, specialColumns);
  }

  getSpecialColumnConfig(
    column: DxiDataGridColumn,
    specialColumns: FilteredColumns[],
  ): { cssClass: string; visibleIndex: number } | null {
    if (column.dataField === 'Class' || column.name === 'Class') {
      return {
        cssClass: 'special-column',
        visibleIndex: 100,
      };
    }

    const matchedColumn = specialColumns.find((filteredColumn) => column.name === filteredColumn.name);

    if (!matchedColumn) {
      return null;
    }

    return {
      cssClass: matchedColumn.role === DatasetAttributesRoles.LABEL ? 'special-column' : 'special-time-column',
      visibleIndex: 100,
    };
  }

  customizeColumns(
    columns: DxiDataGridColumn[],
    specialColumns: FilteredColumns[],
    settings: DatasetViewTableComponentSettings,
    
  ) {
    let visibleIndexCounter = 1;

    columns.forEach((column) => {
      const dataField = column.dataField || '';
      column.fixed = true;
      column.fixedPosition = 'left';
      const specialConfig = this.getSpecialColumnConfig(column, specialColumns);

      if (specialConfig) {
        column.cssClass = (column.cssClass || '') + ' ' + specialConfig.cssClass;
        column.visibleIndex = specialConfig.visibleIndex;
        column.width = 'auto';

      } else if (column.name === '#') {
        column.width = 50;
        column.visibleIndex = 0;
        column.allowReordering = false;
        column.allowSorting = false;
        column.allowFiltering = false;
        column.cssClass = 'bold fixed-height-row';
        column.showInColumnChooser = false;
      } else {
        column.width = column.width ? parseFloat(column.width as string) : dataField.length * 12;
        const calcMinWidth = column.width * 0.5;
        column.minWidth = calcMinWidth < 80 ? 80 : calcMinWidth;
        column.allowHeaderFiltering = true;
        column.allowFiltering = true;
        column.allowSorting = true;
        

        if (column.visibleIndex === undefined || column.visibleIndex === 0) {
          column.visibleIndex = visibleIndexCounter++;
        }
      }
      column.allowHiding = this.getAllowHiding(column, specialColumns);
    });
  }

  
}