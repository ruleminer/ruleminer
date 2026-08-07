import { Injectable } from '@angular/core';

import { take } from 'rxjs';

import { Store } from '@ngrx/store';
import dxDataGrid, { OptionChangedEvent } from 'devextreme/ui/data_grid';

import { TreeviewRefreshService } from '../../../main/project/dataset/treeview/service/treeview-refresh.service';
import { AppState } from '../../store/app-state.model';
import { Ids } from '../../store/ruleSets/rulesets.selectors';

export interface TableInstance {
  pageIndex: number;
  pageSize: number;
  selectedRowUuids: string[];
}

export interface ColumnInfo {
  dataField: string;
  dataType: string;
  name: string;
  sortIndex?: number;
  sortOrder?: 'asc' | 'desc';
  visible: boolean;
  visibleIndex: number;
}

@Injectable({
  providedIn: 'root',
})
export class TableInstanceService {
  private selectedRowsUuids: string[] = [];
  private sortedColums: ColumnInfo[];

  constructor(private store: Store<AppState>, private treeRefreshService: TreeviewRefreshService) {}

  public setSelectedRowsUuids(value: string[]) {
    this.selectedRowsUuids = value;
  }

  public getSelectedRowsUuids() {
    return this.selectedRowsUuids;
  }

  public getSortedColumns() {
    return this.sortedColums;
  }

  /**
   * Returns the indexes of the rows that should be selected.
   *
   * @param dataGridInstance - table instance
   * @param uuids            - row uuids to select
   */
  public getRowsToSelect(dataGridInstance: dxDataGrid, uuids: string[]) {
    return dataGridInstance
      .getDataSource()
      .store()
      .load()
      .then((rows) => {
        const rowsToSelect: number[] = [];
        const allRows = rows as any[];

        uuids.forEach((uuid: any) => {
          const index = allRows.findIndex((x) => x.uuid === uuid);

          if (index > -1) {
            rowsToSelect.push(index + 1);
          }
        });

        return rowsToSelect;
      });
  }

  /**
   * Saving information about column sorting.
   *
   * @param event - table change event
   */
  public saveColumnSorting(event: OptionChangedEvent) {
    const columns: ColumnInfo[] = event.component.state().columns;
    const sortedColums = [];

    for (let i = 0; i < columns.length; i++) {
      if (Object.hasOwn(columns[i], 'sortOrder')) {
        sortedColums.push(columns[i]);
      }
    }

    this.sortedColums = sortedColums;
  }

  public openRulesetTab(dataSetId: number, ruleSetId: number, text: string) {
    this.store
      .select((state) => state.project.activeProject.id)
      .pipe(take(1))
      .subscribe((res) => {
        const ids: Ids = {
          projectId: res,
          dataSetId,
          ruleSetId,
        };

        this.treeRefreshService.openRuleSetTab(ids, text);
      });
  }
}
