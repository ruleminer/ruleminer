import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';

export interface v2DataSetTable {
  id: string;
  state: string;
  filter?: any;
  sort?: any;
  totalCount?: number;
  filteredCount?: number;
  columns?: DxiDataGridColumn[];
  exportCount?: number;
  columnsWithFilterOperations?: any[];
}
