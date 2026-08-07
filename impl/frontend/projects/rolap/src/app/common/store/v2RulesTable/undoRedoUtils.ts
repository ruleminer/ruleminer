import { EntityState } from '@ngrx/entity';

import { UndoRedoAction, V2RulesTableData, v2TableUndoActions, v2TableUndoData } from './types';
import { V2RulesTableActions } from './v2RulesTable.action';

export const undoRedoTriggerActions = [
  V2RulesTableActions.removeRowFromCurrentTable,
  V2RulesTableActions.addRowToCurrentTable,
  V2RulesTableActions.addMultipleRowsToCurrentTable,
  V2RulesTableActions.updateCurrentTableRowComplete, // We want to observe only complete because we don't run updateCurrentTableRow if row was not edited
];

export type ActionFromUndoRedoTrigger =
  | ReturnType<typeof V2RulesTableActions.removeRowFromCurrentTable>
  | ReturnType<typeof V2RulesTableActions.addRowToCurrentTable>
  | ReturnType<typeof V2RulesTableActions.addMultipleRowsToCurrentTable>
  | ReturnType<typeof V2RulesTableActions.updateCurrentTableRowComplete>;

/* Creates undo data for the undo stack based on action that was performed */
export const createUndoDataForUndoStack = (
  action: ActionFromUndoRedoTrigger,
  highestUndoId: number,
  v2RulesTableData: V2RulesTableData,
): v2TableUndoData => {
  const handlers = {
    [V2RulesTableActions.removeRowFromCurrentTable.type]: () => {
      const specificAction = action as ReturnType<typeof V2RulesTableActions.removeRowFromCurrentTable>;
      const rowThatWillBeRemoved = v2RulesTableData.find((row) => row.uuid === specificAction.rowUuid);
      return {
        id: highestUndoId + 1,
        rowUuids: [specificAction.rowUuid],
        rows: [rowThatWillBeRemoved],
        action: v2TableUndoActions.REMOVE,
      };
    },
    [V2RulesTableActions.addRowToCurrentTable.type]: () => {
      const specificAction = action as ReturnType<typeof V2RulesTableActions.addRowToCurrentTable>;
      return {
        id: highestUndoId + 1,
        rowUuids: [specificAction.newRow.uuid],
        rows: [specificAction.newRow],
        action: v2TableUndoActions.ADD,
      };
    },
    [V2RulesTableActions.updateCurrentTableRowComplete.type]: () => {
      const specificAction = action as ReturnType<typeof V2RulesTableActions.updateCurrentTableRowComplete>;
      return {
        id: highestUndoId + 1,
        rowUuids: [specificAction.editedRow.uuid],
        rows: [specificAction.editedRow],
        originalRow: specificAction.originalRow,
        action: v2TableUndoActions.EDIT,
      };
    },
    [V2RulesTableActions.addMultipleRowsToCurrentTable.type]: () => {
      const specificAction = action as ReturnType<typeof V2RulesTableActions.addMultipleRowsToCurrentTable>;
      return {
        id: highestUndoId + 1,
        rowUuids: specificAction.newRows.map((row) => row.uuid),
        rows: specificAction.newRows,
        action: v2TableUndoActions.ADD_MULTIPLE,
      };
    },
  };

  if (!handlers[action.type]) {
    throw new Error('Unknown action type');
  }

  return handlers[action.type]();
};

/** Retrieves either the first or last entity from the given entity state. */
export const getFirstOrLastEntity = <T>(stack: EntityState<T>, getFirst: boolean): T => {
  const ids = stack.ids as number[];
  const id = getFirst ? ids[0] : ids[ids.length - 1];
  const data = stack.entities[id];
  if (!data) {
    throw new Error('Could not find data');
  }
  return data;
};

export type PerformUndoRedoActionReturnType =
  | ReturnType<typeof V2RulesTableActions.removeRowFromCurrentTable>
  | ReturnType<typeof V2RulesTableActions.addRowToCurrentTable>
  | ReturnType<typeof V2RulesTableActions.updateCurrentTableRow>
  | ReturnType<typeof V2RulesTableActions.addMultipleRowsToCurrentTable>
  | ReturnType<typeof V2RulesTableActions.removeMultipleRowsFromCurrentTable>;

export const undoHandlers: Record<v2TableUndoActions, (action: UndoRedoAction) => PerformUndoRedoActionReturnType> = {
  [v2TableUndoActions.REMOVE]: (action) => {
    if (!action.data.rows || action.data.rows.length === 0) {
      throw new Error('Row is missing in undo remove action');
    }
    return V2RulesTableActions.addRowToCurrentTable({ newRow: action.data.rows[0], isUserAction: false });
  },
  [v2TableUndoActions.ADD]: (action) => {
    if (!action.data.rowUuids || action.data.rowUuids.length === 0) {
      throw new Error('Row uuid is missing in undo add action');
    }
    return V2RulesTableActions.removeRowFromCurrentTable({
      rowUuid: action.data.rowUuids[0],
      isUserAction: false,
    });
  },
  [v2TableUndoActions.ADD_MULTIPLE]: (action) => {
    if (!action.data.rows || action.data.rows.length === 0) {
      throw new Error('Rows are missing in redo remove action');
    }
    const rowUuids = action.data.rows.map((row) => row.uuid);
    if (!rowUuids) {
      throw new Error('Row uuids are missing in undo add multiple action');
    }
    return V2RulesTableActions.removeMultipleRowsFromCurrentTable({ rowUuids, isUserAction: false });
  },
  [v2TableUndoActions.EDIT]: (action) => {
    const originalRow = action.data.originalRow;
    if (!originalRow) {
      throw new Error('Original row is missing in undo edit action');
    }
    return V2RulesTableActions.updateCurrentTableRow({ editedRow: originalRow, isUserAction: false });
  },
};

export const redoHandlers: Record<v2TableUndoActions, (action: UndoRedoAction) => PerformUndoRedoActionReturnType> = {
  [v2TableUndoActions.REMOVE]: (action) => {
    if (!action.data.rowUuids || action.data.rowUuids.length === 0) {
      throw new Error('Row uuid is missing in redo remove action');
    }
    return V2RulesTableActions.removeRowFromCurrentTable({
      rowUuid: action.data.rowUuids[0],
      isUserAction: false,
    });
  },
  [v2TableUndoActions.ADD]: (action) => {
    if (!action.data.rows || action.data.rows.length === 0) {
      throw new Error('Row is missing in redo remove action');
    }
    return V2RulesTableActions.addRowToCurrentTable({ newRow: action.data.rows[0], isUserAction: false });
  },
  [v2TableUndoActions.ADD_MULTIPLE]: (action) => {
    if (!action.data.rows) {
      throw new Error('Rows are missing in redo remove action');
    }
    return V2RulesTableActions.addMultipleRowsToCurrentTable({ newRows: action.data.rows, isUserAction: false });
  },

  [v2TableUndoActions.EDIT]: (action) => {
    if (!action.data.rows || action.data.rows.length === 0) {
      throw new Error('Row is missing in redo edit action');
    }
    return V2RulesTableActions.updateCurrentTableRow({ editedRow: action.data.rows[0], isUserAction: false });
  },
};

export const performUndoRedoActionHandlers = {
  undo: undoHandlers,
  redo: redoHandlers,
};
