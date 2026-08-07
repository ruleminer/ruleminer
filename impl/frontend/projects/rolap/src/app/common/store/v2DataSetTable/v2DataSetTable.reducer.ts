import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { v2DataSetTable } from './types';
import { V2DataSetTableActions } from './v2DataSetTable.action';

export const v2DataSetTableAdapter: EntityAdapter<v2DataSetTable> = createEntityAdapter<v2DataSetTable>();
export type v2DataSetTableState = EntityState<v2DataSetTable>;

export const initialState: v2DataSetTableState = v2DataSetTableAdapter.getInitialState();

export const v2DataSetTableReducer = createReducer(
  initialState,
  on(V2DataSetTableActions.add, (state, action) => {
    return v2DataSetTableAdapter.addOne(action.dataSetTable, state);
  }),
  on(V2DataSetTableActions.remove, (state, action) => {
    return v2DataSetTableAdapter.removeOne(action.key, state);
  }),
  on(V2DataSetTableActions.removeAll, (state) => {
    return v2DataSetTableAdapter.removeAll(state);
  }),
  on(V2DataSetTableActions.setState, (state) => state),
  on(V2DataSetTableActions.setStateComplete, (state, action) => {
    return v2DataSetTableAdapter.updateOne({ id: action.key, changes: { state: action.tableState } }, state);
  }),
  on(V2DataSetTableActions.setFilterStateComplete, (state, action) => {
    return v2DataSetTableAdapter.updateOne(
      {
        id: action.key,
        changes: {
          filter: action.filter,
          sort: action.sort,
          totalCount: action.totalCount,
        },
      },
      state,
    );
  }),
  on(V2DataSetTableActions.setFilteredCountComplete, (state, action) => {
    return v2DataSetTableAdapter.updateOne(
      {
        id: action.key,
        changes: { filteredCount: action.filteredCount },
      },
      state,
    );
  }),
  on(V2DataSetTableActions.setColumnsComplete, (state, action) => {
    return v2DataSetTableAdapter.updateOne(
      {
        id: action.key,
        changes: { columns: action.columns },
      },
      state,
    );
  }),
  on(V2DataSetTableActions.setExportCountComplete, (state, action) => {
    return v2DataSetTableAdapter.updateOne(
      {
        id: action.key,
        changes: { exportCount: action.exportCount },
      },
      state,
    );
  }),
  on(V2DataSetTableActions.setColumnsWithFilterOperations, (state, action) => state),
  on(V2DataSetTableActions.setColumnsWithFilterOperationsComplete, (state, action) => {
    return v2DataSetTableAdapter.updateOne(
      {
        id: action.key,
        changes: { columnsWithFilterOperations: action.columnsWithFilterOperations },
      },
      state,
    );
  }),
);
