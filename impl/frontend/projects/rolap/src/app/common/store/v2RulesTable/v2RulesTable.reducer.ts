import { EntityAdapter, EntityState, Update, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { without } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { NewRow } from '../../../main/project/models/ruleset';
import { Label } from '../../components/label/interfaces/label.model';
import { removeIfAndThenFromRule } from '../ruleSets/rulesets.reducer';
import { V2RulesTable, v2TableUndoData } from './types';
import { getFirstOrLastEntity } from './undoRedoUtils';
import { makeDisplayConclusionValue } from './utils';
import { V2RulesTableActions } from './v2RulesTable.action';

// Define an adapter and state for V2RulesTable
export const V2RulesTableAdapter: EntityAdapter<V2RulesTable> = createEntityAdapter<V2RulesTable>();
export const initialState: EntityState<V2RulesTable> = V2RulesTableAdapter.getInitialState();

// Define an adapter and state for UNDO
export const v2UndoStackAdapter: EntityAdapter<v2TableUndoData> = createEntityAdapter<v2TableUndoData>();
export type V2UndoStackAdapterState = EntityState<v2TableUndoData>;

// Define an initial state for REDO
export const v2RedoStackAdapter: EntityAdapter<v2TableUndoData> = createEntityAdapter<v2TableUndoData>();
export type V2RedoStackAdapterState = EntityState<v2TableUndoData>;

export const v2RulesTableReducer = createReducer(
  initialState,
  /* NGRX Entity Actions */
  on(V2RulesTableActions.add, (state, action) => {
    return V2RulesTableAdapter.addOne(action.v2RulesTable, state);
  }),
  on(V2RulesTableActions.remove, (state, action) => {
    return V2RulesTableAdapter.removeOne(action.key, state);
  }),
  on(V2RulesTableActions.removeAll, (state) => {
    return V2RulesTableAdapter.removeAll(state);
  }),

  /* Set V2 Table Properties */
  on(V2RulesTableActions.setState, (state, action) => state),
  on(V2RulesTableActions.setStateComplete, (state, { key, tableState }) =>
    V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: { state: tableState },
      },
      state,
    ),
  ),
  on(V2RulesTableActions.setCoverageForCurrentTab, (state, action) => state),
  on(V2RulesTableActions.setCoverageForCurrentTabComplete, (state, { key, coverage }) =>
    V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: { coverage, rulesWithOutdatedCoverages: {}, coverageNeedsRefetch: false },
      },
      state,
    ),
  ),
  on(V2RulesTableActions.setCoverageNeedsRefetchForCurrentTab, (state, action) => state),
  on(V2RulesTableActions.setCoverageNeedsRefetchForCurrentTabComplete, (state, { key, needsRefetch }) =>
    V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: { coverageNeedsRefetch: needsRefetch },
      },
      state,
    ),
  ),
  on(V2RulesTableActions.setTableDataForCurrent, (state, action) => state),

  on(V2RulesTableActions.setTableDataForCurrentComplete, (state, { key, data }) => {
    let newTable = [...data.table].map((row: any) => {
      const updatedRow = Object.assign({}, row);
      data.rulesIndicators.forEach((indicator: any) => {
        if (updatedRow.uuid === indicator.rule_uuid) {
          Object.assign(updatedRow, indicator.indicators);
        }
      });
      return updatedRow;
    });
    newTable = newTable.map((obj: any) => {
      const newData = data.rulesCoverage[obj.uuid];
      if (newData) {
        return { ...obj, ...newData, displayString: removeIfAndThenFromRule(obj.string) };
      }
      return obj;
    });

    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          data: [...newTable],
        },
      },
      state,
    );
  }),

  /* Update Table Row */
  on(V2RulesTableActions.updateCurrentTableRow, (state, action) => state),
  on(V2RulesTableActions.updateCurrentTableRowComplete, (state, { key, editedRow, isUserAction }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;

    const updatedData = v2RulesTable.data.map((row: any) => {
      if (row.uuid === editedRow.uuid) {
        return { ...row, ...editedRow };
      }
      return row;
    });

    const rulesWithOutdatedCoverages = isUserAction 
      ? { ...v2RulesTable.rulesWithOutdatedCoverages, [editedRow.uuid]: true }
      : v2RulesTable.rulesWithOutdatedCoverages;

    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          data: updatedData,
          rulesWithOutdatedCoverages,
          coverageNeedsRefetch: isUserAction, 
        },
      }, 
      state,
    );
  }),

  /* Add Table Row */
  on(V2RulesTableActions.addRowToCurrentTable, (state, action) => state),
  on(V2RulesTableActions.addRowToCurrentTableComplete, (state, { key, newRow }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    const rulesWithOutdatedCoverages: any = { ...v2RulesTable.rulesWithOutdatedCoverages, [newRow.uuid]: true };

    let data;
    if (newRow.autoIncrement !== undefined) {
      const insertPosition = newRow.autoIncrement - 1; // Correcting for 0-based index
      const updatedData = v2RulesTable.data.map((row) => {
        if (row.autoIncrement >= newRow.autoIncrement) {
          return {
            ...row,
            autoIncrement: row.autoIncrement + 1,
            ruleName: row.autoIncrement + 1,
          };
        }
        return row;
      });

      // Insert the newRow at the correct position
      data = [...updatedData.slice(0, insertPosition), newRow, ...updatedData.slice(insertPosition)];
    } else {
      data = [
        newRow,
        ...v2RulesTable.data.map((row: any) => ({
          ...row,
          autoIncrement: row.autoIncrement + 1,
          ruleName: row.autoIncrement + 1,
        })),
      ];
    }

    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          data,
          activeRowsUuids: [...v2RulesTable.activeRowsUuids, newRow.uuid],
          rulesWithOutdatedCoverages,
          coverageNeedsRefetch: true,
        },
      },
      state,
    );
  }),
  on(V2RulesTableActions.addMultipleRowsToCurrentTable, (state) => state),
  on(V2RulesTableActions.addMultipleRowsToCurrentTableComplete, (state, { key, newRows }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;

    const rulesWithOutdatedCoverages: any = {
      ...v2RulesTable.rulesWithOutdatedCoverages,
      ...newRows.reduce((acc, row) => ({ ...acc, [row.uuid]: true }), {}),
    };

    let data = v2RulesTable.data;
    newRows.forEach((newRow) => {
      if (newRow.autoIncrement !== undefined) {
        const insertPosition = newRow.autoIncrement - 1;
        data = [
          ...data.slice(0, insertPosition),
          newRow,
          ...data.slice(insertPosition).map((row) => ({
            ...row,
            autoIncrement: row.autoIncrement + 1,
            ruleName: row.autoIncrement + 1,
          })),
        ];
      } else {
        data = [
          newRow,
          ...data.map((row) => ({
            ...row,
            autoIncrement: row.autoIncrement + 1,
            ruleName: row.autoIncrement + 1,
          })),
        ];
      }
    });

    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          data,
          activeRowsUuids: [...v2RulesTable.activeRowsUuids, ...newRows.map((row) => row.uuid)],
          rulesWithOutdatedCoverages,
          coverageNeedsRefetch: true,
        },
      },
      state,
    );
  }),

  /* Remove Table Row */
  on(V2RulesTableActions.removeRowFromCurrentTable, (state, action) => state),
  /* Prepare Table DevExtreme State before removing row */
  on(V2RulesTableActions.prepareTableDevExtremeStateBeforeRemovingRow, (state, { key, rowUuid }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    let newState = JSON.parse(v2RulesTable.state);
    const selectedRowKeys = newState.selectedRowKeys || [];
    //remove row from selectedRowKeys
    newState = {
      ...newState,
      selectedRowKeys: without([...selectedRowKeys], rowUuid),
    };
    const stateString = JSON.stringify(newState);
    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          state: stateString,
        },
      },
      state,
    );
  }),
  /* Remove Table Row Complete */
  on(V2RulesTableActions.removeRowFromCurrentTableComplete, (state, { key, rowUuid }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    const rulesWithOutdatedCoverages: any = { ...v2RulesTable.rulesWithOutdatedCoverages };
    delete rulesWithOutdatedCoverages[rowUuid];

    const rowToRemove = v2RulesTable.data.find((row) => row.uuid === rowUuid);
    if (!rowToRemove) return state;

    const removePosition = rowToRemove.autoIncrement - 1;

    const updatedData = v2RulesTable.data
      .filter((row) => row.uuid !== rowUuid)
      .map((row) => {
        if (row.autoIncrement > removePosition) {
          return {
            ...row,
            autoIncrement: row.autoIncrement - 1,
          };
        }
        return row;
      });

    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          data: updatedData,
          activeRowsUuids: without([...v2RulesTable.activeRowsUuids], rowUuid),
          compareRowsUuids: without([...v2RulesTable.compareRowsUuids], rowUuid),
          rulesWithOutdatedCoverages,
          coverageNeedsRefetch: true,
        },
      },
      state,
    );
  }),

  /* Remove multiple rows */
  on(V2RulesTableActions.removeMultipleRowsFromCurrentTable, (state) => state),
  on(V2RulesTableActions.prepareTableDevExtremeStateBeforeRemovingRows, (state, { key, rowUuids }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;

    let newState = JSON.parse(v2RulesTable.state);
    const selectedRowKeys = newState.selectedRowKeys || [];

    // Remove rows from selectedRowKeys
    newState = {
      ...newState,
      selectedRowKeys: without([...selectedRowKeys], ...rowUuids),
    };

    const stateString = JSON.stringify(newState);

    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          state: stateString,
        },
      },
      state,
    );
  }),
  on(V2RulesTableActions.removeMultipleRowsFromCurrentTableComplete, (state, { key, rowUuids }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;

    const rulesWithOutdatedCoverages: any = { ...v2RulesTable.rulesWithOutdatedCoverages };
    rowUuids.forEach((uuid) => delete rulesWithOutdatedCoverages[uuid]);

    const updatedData = v2RulesTable.data
      .filter((row) => !rowUuids.includes(row.uuid))
      .map((row) => {
        const removePositions = rowUuids.map(
          (uuid) => v2RulesTable.data.find((r) => r.uuid === uuid)?.autoIncrement || -1,
        );
        const adjustment = removePositions.filter((pos) => pos < row.autoIncrement).length;
        return {
          ...row,
          autoIncrement: row.autoIncrement - adjustment,
        };
      });

    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          data: updatedData,
          activeRowsUuids: without([...v2RulesTable.activeRowsUuids], ...rowUuids),
          compareRowsUuids: without([...v2RulesTable.compareRowsUuids], ...rowUuids),
          rulesWithOutdatedCoverages,
          coverageNeedsRefetch: true,
        },
      },
      state,
    );
  }),

  on(
    V2RulesTableActions.copyRowsFromCurrentTableToAnotherTable,
    (state, { currentTableKey, currentTableRowsUuids, anotherV2TableKey, problemType }) => {
      // Find rows to copy in current table
      const rulesToCopy =
        state.entities[currentTableKey]?.data.filter((row: any) => currentTableRowsUuids.has(row.uuid)) || [];
      // If no rules were found to copy, return the state unmodified to prevent a crash.
      if (rulesToCopy.length === 0) {
        console.warn('Copy rows action was dispatched, but no source rules were found. Aborting copy.');
        return state;
      }

      // Update autoIncrement values for copied table rows
      const mappedRulesToCopy = rulesToCopy.map((rule: any, i: number) => {
        const uuid = uuidv4();
        return {
          string: rule.string,
          labels: rule.labels,
          premise: rule.premise,
          conclusion: rule.conclusion,
          displayString: rule.displayString,
          autoIncrement: i + 1,
          ruleName: i + 1,
          uuid,
          rule_uuid: uuid,
          displayConclusion: makeDisplayConclusionValue(problemType, rule.conclusion),
        } as NewRow;
      });

      // It's now safe to get the last autoIncrement value.
      const lastAutoIncrement = mappedRulesToCopy[mappedRulesToCopy.length - 1].autoIncrement;
      const targetV2Table = state.entities[anotherV2TableKey];
      const rulesBigTable =
        targetV2Table?.data.map((row: any, index: number) => {
          return { ...row, autoIncrement: lastAutoIncrement + index + 1 };
        }) || [];

      // Moved rules should be pushed to outaded coverages
      const rulesWithOutdatedCoverages = { ...targetV2Table?.rulesWithOutdatedCoverages };
      mappedRulesToCopy.forEach((rule: any) => {
        rulesWithOutdatedCoverages[rule.uuid] = true;
      });

      const activeRowsUuids = [
        ...(targetV2Table?.activeRowsUuids || []),
        ...mappedRulesToCopy.map((row: any) => row.uuid),
      ];

      const filteredRowsUuids = [
        ...(targetV2Table?.filteredRowsUuids || []),
        ...mappedRulesToCopy.map((row: any) => row.uuid),
      ];

      return V2RulesTableAdapter.updateOne(
        {
          id: anotherV2TableKey,
          changes: {
            rulesWithOutdatedCoverages,
            data: [...mappedRulesToCopy, ...rulesBigTable],
            activeRowsUuids,
            filteredRowsUuids,
          },
        },
        state,
      );
    },
  ),

  /* Active Column */
  on(V2RulesTableActions.currentTableActivesHeaderToggle, (state, action) => state),
  on(V2RulesTableActions.currentTableActivesHeaderToggleComplete, (state, { key, activeValue }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    if (activeValue) {
      const activeRowsUuids = [...v2RulesTable.data].map((row: any) => row.uuid);
      return V2RulesTableAdapter.updateOne(
        {
          id: key,
          changes: { activeRowsUuids: [...activeRowsUuids] },
        },
        state,
      );
    }
    //deselect all active checkboxes exept the first one
    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          activeRowsUuids: v2RulesTable.data.filter((row: any, i: number) => i === 0).map((row: any) => row.uuid),
        },
      },
      state,
    );
  }),
  on(V2RulesTableActions.updateCurrentTableRowActiveState, (state) => state),
  on(V2RulesTableActions.updateCurrentTableRowActiveStateComplete, (state, { key, rowUuid }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    const isRowActive = v2RulesTable.activeRowsUuids.includes(rowUuid);
    const addRow = [...v2RulesTable.activeRowsUuids, rowUuid];
    //remove row from active rows using lodash
    const removeRow = without([...v2RulesTable.activeRowsUuids], rowUuid);
    const activeRowsUuids = isRowActive ? removeRow : addRow;
    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: { activeRowsUuids: activeRowsUuids },
      },
      state,
    );
  }),

  on(V2RulesTableActions.updateCurrentTableRowCompareState, (state) => state),
  on(V2RulesTableActions.updateCurrentTableRowCompareStateComplete, (state, { key, rowUuid, isRelationOneToMany }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    const isRowActive = v2RulesTable.compareRowsUuids.includes(rowUuid);
    let compareRowsUuids = [];

    if (isRelationOneToMany) {
      compareRowsUuids = [rowUuid];
    } else {
      compareRowsUuids = isRowActive
        ? without([...v2RulesTable.compareRowsUuids], rowUuid)
        : [...v2RulesTable.compareRowsUuids, rowUuid];
    }

    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: { compareRowsUuids: compareRowsUuids },
      },
      state,
    );
  }),

  /* Labels */
  on(V2RulesTableActions.updateLabelsInAllTables, (state, { label }) => {
    const updates: Update<V2RulesTable>[] = Object.keys(state.entities).map((id) => ({
      id,
      changes: {
        // Update the 'data' property of each v2RulesTable entity
        data: state.entities[id]?.data.map((row: any) => {
          if (!row.labels.length) return row;

          return {
            ...row,
            labels: row.labels.map((x: Label) => {
              if (x.id === label.id) {
                return { ...label };
              } else {
                return x;
              }
            }),
          };
        }),
      },
    }));

    return V2RulesTableAdapter.updateMany(updates, state);
  }),
  on(V2RulesTableActions.overwriteLabelsToCurrentTableRow, (state) => state),
  on(V2RulesTableActions.overwriteLabelsToCurrentTableRowsComplete, (state, { key, rowUuid, labels }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          data: v2RulesTable.data.map((row: any) => {
            if (row.uuid !== rowUuid) return row;
            return {
              ...row,
              labels: [...labels],
              labelsText: labels.length ? labels.map((label: any) => label.name).join(', ') : '',
            };
          }),
        },
      },
      state,
    );
  }),
  on(V2RulesTableActions.removeLabelFromRowInCurrentTable, (state) => state),
  on(V2RulesTableActions.removeLabelFromRowInCurrentTableComplete, (state, { key, rowUuid, labelId }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: {
          data: v2RulesTable.data.map((row: any) => {
            if (row.uuid !== rowUuid) return row;
            // label index to remove
            const labelIndex = row.labels.findIndex((x: Label) => x.id === labelId);
            const updatedLabels = [...row.labels.slice(0, labelIndex), ...row.labels.slice(labelIndex + 1)];
            return {
              ...row,
              labels: updatedLabels,
              labelsText: updatedLabels.length ? updatedLabels.map((label: any) => label.name).join(', ') : '',
            };
          }),
        },
      },
      state,
    );
  }),
  on(V2RulesTableActions.removeAllLabelOccurencesFromAllTables, (state, { labelId }) => {
    const updates: Update<V2RulesTable>[] = Object.keys(state.entities).map((id) => ({
      id,
      changes: {
        // Update the 'data' property of each v2RulesTable entity
        data: state.entities[id]?.data.map((row) => {
          if (!row.labels.length) return row;
          // label index to remove
          const labelIndex = row.labels.findIndex((x: Label) => x.id === labelId);

          if (labelIndex === -1) return row;

          return {
            ...row,
            labels: [...row.labels.slice(0, labelIndex), ...row.labels.slice(labelIndex + 1)],
          };
        }),
      },
    }));
    return V2RulesTableAdapter.updateMany(updates, state);
  }),

  /* Attributes Min Max Values */
  on(V2RulesTableActions.setAttributesMinMaxValuesInCurrentTable, (state, action) => state),
  on(
    V2RulesTableActions.setAttributesMinMaxValuesInCurrentTableComplete,
    (state, { key, attributesMinMaxValues, labelMinMaxValues }) => {
      const v2RulesTable = state.entities[key];
      if (!v2RulesTable) return state;
      return V2RulesTableAdapter.updateOne(
        {
          id: key,
          changes: {
            labelMinMaxValues,
            attributesMinMaxValues,
          },
        },
        state,
      );
    },
  ),

  /* UNDO */
  /* UNDO - Add action to undo stack */
  on(V2RulesTableActions.addActionToUndoStack, (state, { undoData }) => {
    return state;
  }),
  /* UNDO - Add action to undo stack Complete */
  on(V2RulesTableActions.addActionToUndoStackComplete, (state, { key, undoData }) => {
    return V2RulesTableAdapter.mapOne(
      {
        id: key,
        map: (v2RulesTable) => ({
          ...v2RulesTable,
          undoStack: v2UndoStackAdapter.setAll(
            [undoData, ...v2UndoStackAdapter.getSelectors().selectAll(v2RulesTable.undoStack)],
            { ...v2RulesTable.undoStack },
          ), //Add to the top
        }),
      },
      state,
    );
  }),

  /* UNDO - Undo action */
  on(V2RulesTableActions.undoAction, (state, action) => state),
  /* UNDO - Undo action Complete */
  on(V2RulesTableActions.undoActionComplete, (state, { key }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    const undoStack = v2RulesTable.undoStack;
    if (undoStack.ids.length === 0) return state;
    const firstUndoData = getFirstOrLastEntity(undoStack, true);
    return V2RulesTableAdapter.mapOne(
      {
        id: key,
        map: (v2RulesTable) => ({
          ...v2RulesTable,
          undoStack: v2UndoStackAdapter.removeOne(firstUndoData.id, v2RulesTable.undoStack),
          redoStack: v2RedoStackAdapter.addOne(firstUndoData, v2RulesTable.redoStack),
        }),
      },
      state,
    );
  }),
  /* Clear Redo Stack */
  on(V2RulesTableActions.clearRedoStack, (state, { key }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    const redoStack = v2RulesTable.redoStack;
    if (redoStack.ids.length === 0) return state;
    return V2RulesTableAdapter.mapOne(
      {
        id: key,
        map: (v2RulesTable) => ({
          ...v2RulesTable,
          redoStack: v2RedoStackAdapter.removeAll(v2RulesTable.redoStack),
        }),
      },
      state,
    );
  }),
  on(V2RulesTableActions.redoActionComplete, (state, { key }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    const redoStack = v2RulesTable.redoStack;
    if (redoStack.ids.length === 0) return state;

    const lastRedoData = getFirstOrLastEntity(redoStack, false);

    return V2RulesTableAdapter.mapOne(
      {
        id: key,
        map: (v2RulesTable) => ({
          ...v2RulesTable,
          redoStack: v2RedoStackAdapter.removeOne(lastRedoData.id, v2RulesTable.redoStack),
          undoStack: v2UndoStackAdapter.setAll(
            [lastRedoData, ...v2UndoStackAdapter.getSelectors().selectAll(v2RulesTable.undoStack)],
            { ...v2RulesTable.undoStack },
          ), //Add to the top
        }),
      },
      state,
    );
  }),
  on(V2RulesTableActions.updateFilteredRowsUuids, (state) => state),
  on(V2RulesTableActions.updateFilteredRowsUuidsComplete, (state, { key, filteredRowsUuids }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: { filteredRowsUuids },
      },
      state,
    );
  }),

  on(V2RulesTableActions.setShouldGoToTheFirstPageOnSort, (state) => state),
  on(V2RulesTableActions.setShouldGoToTheFirstPageOnSortComplete, (state, { key, shouldGoToTheFirstPageOnSort }) => {
    const v2RulesTable = state.entities[key];
    if (!v2RulesTable) return state;
    return V2RulesTableAdapter.updateOne(
      {
        id: key,
        changes: { shouldGoToTheFirstPageOnSort },
      },
      state,
    );
  }),

  on(V2RulesTableActions.setRefreshForAllTables, (state, {}) => {
    return state;
  }),

  on(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpened, (state, {}) => {
    return state;
  }),
  on(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsClosed, (state, {}) => {
    return state;
  }),
);
