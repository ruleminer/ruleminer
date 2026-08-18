import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';

import { v2DataSetTable } from './types';

export const V2DataSetTableActions = createActionGroup({
  source: 'V2 Data Set Table Actions',
  events: {
    Add: props<{ dataSetTable: v2DataSetTable }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),
    'Set State': props<{ tableState: string }>(),
    'Set State Complete': props<{ key: string; tableState: string }>(),
    'Set Filter State': props<{
      filter: any | undefined;
      sort: any | undefined;
      totalCount: number;
    }>(),
    'Set Filter State Complete': props<{
      key: string;
      filter: any | undefined;
      sort: any | undefined;
      totalCount: number;
    }>(),
    'Set Filtered Count': props<{ filteredCount: number }>(),
    'Set Filtered Count Complete': props<{
      key: string;
      filteredCount: number;
    }>(),
    'Set Columns': props<{ columns: DxiDataGridColumn[] }>(),
    'Set Columns Complete': props<{ key: string; columns: DxiDataGridColumn[] }>(),
    'Set Export Count': props<{ exportCount: number }>(),
    'Set Export Count Complete': props<{ key: string; exportCount: number }>(),
    'Set Columns With Filter Operations': props<{ columnsWithFilterOperations: any[] }>(),
    'Set Columns With Filter Operations Complete': props<{ key: string; columnsWithFilterOperations: any[] }>(),
  },
});
