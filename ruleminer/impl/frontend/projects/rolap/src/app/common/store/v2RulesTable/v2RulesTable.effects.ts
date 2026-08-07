import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import {
  EMPTY,
  combineLatest,
  concatMap,
  debounceTime,
  exhaustMap,
  filter,
  map,
  mergeMap,
  of,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EntityState } from '@ngrx/entity';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { isEqual, sortBy } from 'lodash';

import { DatasetService } from '../../../main/project/dataset/service/dataset.service';
import { TreeviewRefreshService } from '../../../main/project/dataset/treeview/service/treeview-refresh.service';
import { RefreshService } from '../../../main/project/service/refresh.service';
import { RulesCustomizeColumnsService } from '../../../main/project/service/rules-customize-columns.service';
import { NotifyService } from '../../services/notify/notify.service';
import { RuleSetService } from '../../services/rule-set/rule-set.service';
import { AppState, RefreshAllState } from '../app-state.model';
import { activeProjectSelector } from '../project/project.selectors';
import {
  predictionIndicatorsRefreshAllChange,
  predictionIndicatorsTestDataRefresh,
  predictionIndicatorsTrainingDataRefresh,
  ruleSetImportanceRefreshChange,
  ruleSetPredictionIndicatorsRefreshChange,
  ruleSetQuantitativeCharacteristicsRefreshChange,
  rulesRefreshAllChange,
} from '../ruleSets/rulesets.action';
import { selectRefreshBtnState } from '../ruleSets/rulesets.reducer';
import { Ids } from '../ruleSets/rulesets.selectors';
import { V2ClassifyCardActions } from '../v2Classify/v2Classify.action';
import { V2CurrentTabAction } from '../v2CurrentTab/v2CurrentTab.action';
import { generateNgrxKey, isRuleSet } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { selectCurrentV2Tab } from '../v2Tabs/v2Tabs.selectors';
import { v2TableUndoData } from './types';
import {
  createUndoDataForUndoStack,
  getFirstOrLastEntity,
  performUndoRedoActionHandlers,
  undoRedoTriggerActions,
} from './undoRedoUtils';
import { checkIfRuleSetContainsAlternatives, makeDisplayConclusionValue, wasRowEdited } from './utils';
import { V2RulesTableActions } from './v2RulesTable.action';
import {
  isLoadingV2RulesTableData,
  selectCurrentV2RulesTableCoverage,
  selectCurrentV2RulesTableData,
  selectCurrentV2RulesTableFilteredUuids,
  selectCurrentV2RulesTableRedoStack,
  selectCurrentV2RulesTableUndoStack,
  selectUndoStackIds,
} from './v2RulesTable.selectors';

@Injectable()
export class V2RulesTableEffects {
  /* NGRX Entity Actions */
  addRuleSet = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.addTab),
      withLatestFrom(this.store$.pipe(select(activeProjectSelector))),
      mergeMap(([action, activeProject]) => {
        const type = action.tab.type;
        if (!isRuleSet(type)) return EMPTY;
        const projectId = action.tab.ids.projectId as number;
        const dataSetId = action.tab.ids.dataSetId as number;
        const ruleSetId = action.tab.ids.ruleSetId as number;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, type);

        const problemType = activeProject?.type_of_problem;

        // Default table states
        const rulesStateJson = {
          pageIndex: 0,
          pageSize: 20,
          columns: this.rulesCustomizeColumnsService.getInitalColumns(problemType),
          allowedPageSizes: [5, 10, 20, 50],
        };
        const state = JSON.stringify(rulesStateJson);

        return this.ruleSetService.getRulesetData(dataSetId, ruleSetId, false).pipe(
          map(({ meta, table, coverage }) => {
            const activeRowsUuids = table.map((row: any) => row.uuid); // on inital load all rows are active
            const filteredRowsUuids = activeRowsUuids;
            const firstUuid = activeRowsUuids[0];
            const compareRowsUuids = firstUuid ? [firstUuid] : [];
            const undoStack: EntityState<v2TableUndoData> = { ids: [], entities: {} }; // undo stack is empty on inital load
            const redoStack: EntityState<v2TableUndoData> = { ids: [], entities: {} }; // redo stack is empty on inital load
            const containsAlternatives = checkIfRuleSetContainsAlternatives(table as any);
            return {
              v2RulesTable: {
                id,
                state,
                meta,
                coverage: coverage.rule_coverage,
                coverageNeedsRefetch: false,
                data: table.map((row: any) => {
                  return {
                    ...row,
                    conclusion: row.conclusion,
                    displayConclusion: makeDisplayConclusionValue(problemType, row.conclusion),
                    labelsText: row.labels?.length ? row.labels.map((label: any) => label.name).join(', ') : '',
                  };
                }),
                shouldGoToTheFirstPageOnSort: true,
                rulesWithOutdatedCoverages: {},
                attributesMinMaxValues: {},
                activeRowsUuids,
                filteredRowsUuids,
                compareRowsUuids,
                undoStack,
                redoStack,
                containsAlternatives,
              },
              dataSetId,
            };
          }),

          switchMap(({ v2RulesTable, dataSetId }) => {
            const labelAttributeName: string = v2RulesTable.meta.decision_attribute;
            if (!labelAttributeName) return of(V2RulesTableActions.add({ v2RulesTable }));
            //Logic for loading attributes min max values
            return this.datasetService.getAttributesMinMaxValuesWithStatistics(dataSetId).pipe(
              switchMap(({ attributesMinMaxValues, statistics }) => {
                const labelMinMaxValues = attributesMinMaxValues[labelAttributeName];
                delete attributesMinMaxValues[labelAttributeName];

                const finalV2RulesTableWithAttributes = {
                  ...v2RulesTable,
                  labelMinMaxValues: labelMinMaxValues,
                  attributesMinMaxValues,
                  statistics: statistics.summary,
                };
                return of(V2RulesTableActions.add({ v2RulesTable: finalV2RulesTableWithAttributes }));
              }),
            );
          }),
        );
      }),
    );
  });
  removeAllTabs = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap(() => of(V2RulesTableActions.removeAll())),
    );
  });
  removeTab = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2RulesTableActions.remove({ key }));
      }),
    );
  });

  /* Set V2 Table Properties */
  setTableData = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.setTableDataForCurrent),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const data = action.data;
        return of(V2RulesTableActions.setTableDataForCurrentComplete({ key: currentTabId, data }));
      }),
    );
  });
  setState = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.setState),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const tableState = action.tableState;
        return of(V2RulesTableActions.setStateComplete({ key: currentTabId, tableState }));
      }),
    );
  });
  /* Coverage */
  setCoverageForCurrentTab = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.setCoverageForCurrentTab),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentV2Tab)),
        this.store$.pipe(select(selectCurrentV2RulesTableCoverage)),
      ),
      mergeMap(([action, currentTab, tableCoverage]) => {
        const currentTabId = currentTab?.id as string;
        const newCoverage = action.coverage;
        const coverage = { ...tableCoverage, ...newCoverage };
        return of(V2RulesTableActions.setCoverageForCurrentTabComplete({ key: currentTabId, coverage }));
      }),
    );
  });
  setCoverageNeedsRefetchForCurrentTab = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.setCoverageNeedsRefetchForCurrentTab),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const needsRefetch = action.needsRefetch;
        return of(
          V2RulesTableActions.setCoverageNeedsRefetchForCurrentTabComplete({ key: currentTabId, needsRefetch }),
        );
      }),
    );
  });

  /* Update Table Row */
  updateCurrentTableRow = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.updateCurrentTableRow),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentV2Tab)),
        this.store$.pipe(select(selectCurrentV2RulesTableData), filterOutNullish()),
      ),
      mergeMap(([action, currentTab, v2RulesTableData]) => {
        const currentTabId = currentTab?.id as string;
        const editedRow = action.editedRow;
        let shouldUpdateRowInV2Table = false;
        let originalRow = null;
        v2RulesTableData.forEach((row: any) => {
          if (row.uuid === editedRow.uuid && wasRowEdited(editedRow, row)) {
            shouldUpdateRowInV2Table = true;
            originalRow = row;
          }
        });
        //if nothing was edited, do not update the row
        if (!shouldUpdateRowInV2Table) return EMPTY;
        //if something was edited, set refresh for all tables & update the row
        const ids: Ids = {
          projectId: currentTab?.ids.projectId as number,
          dataSetId: currentTab?.ids.dataSetId as number,
          ruleSetId: currentTab?.ids.ruleSetId as number,
        };
        this.refreshService.setRefreshForAllTables(ids);
        return of(
          V2RulesTableActions.updateCurrentTableRowComplete({
            key: currentTabId,
            editedRow,
            originalRow,
            isUserAction: action.isUserAction,
          }),
        );
      }),
    );
  });

  /* Add Table Row */
  addRowToCurrentTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.addRowToCurrentTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const newRow = action.newRow;
        return of(V2RulesTableActions.addRowToCurrentTableComplete({ key: currentTabId, newRow }));
      }),
    );
  });

  addMultipleRowsToCurrentTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.addMultipleRowsToCurrentTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const newRows = action.newRows;
        return of(V2RulesTableActions.addMultipleRowsToCurrentTableComplete({ key: currentTabId, newRows }));
      }),
    );
  });

  /* Remove Table Row */
  removeRowFromCurrentTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.removeRowFromCurrentTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const rowUuid = action.rowUuid;
        return of(V2RulesTableActions.prepareTableDevExtremeStateBeforeRemovingRow({ key: currentTabId, rowUuid }));
      }),
    );
  });

  /* Remove Table Row Complete */
  /* After Devextreme state is prepared, we can safely remove the row from table array */
  removeRowFromCurrentTableComplete = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.prepareTableDevExtremeStateBeforeRemovingRow),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const rowUuid = action.rowUuid;
        return of(V2RulesTableActions.removeRowFromCurrentTableComplete({ key: currentTabId, rowUuid }));
      }),
    );
  });

  /* Remove Multiple Rows From Current Table */
  removeMultipleRowsFromCurrentTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.removeMultipleRowsFromCurrentTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const rowUuids = action.rowUuids;
        return of(V2RulesTableActions.prepareTableDevExtremeStateBeforeRemovingRows({ key: currentTabId, rowUuids }));
      }),
    );
  });

  /* Prepare Table DevExtreme State Before Removing Rows */
  prepareTableDevExtremeStateBeforeRemovingRows = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.prepareTableDevExtremeStateBeforeRemovingRows),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const rowUuids = action.rowUuids;
        return of(V2RulesTableActions.removeMultipleRowsFromCurrentTableComplete({ key: currentTabId, rowUuids }));
      }),
    );
  });

  /* Active Column */
  currentTableActivesHeaderToggle = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.currentTableActivesHeaderToggle),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const activeValue = action.activeValue;
        // Show warning if user deselects all rows
        if (activeValue === false) {
          this.notifyService.showNotify(this.translate.instant('project.rules.deselect_all'), 'warning');
        }

        //update refresh for all tables
        const ids: Ids = {
          projectId: currentTab?.ids.projectId as number,
          dataSetId: currentTab?.ids.dataSetId as number,
          ruleSetId: currentTab?.ids.ruleSetId as number,
        };
        this.refreshService.setRefreshForAllTables(ids);
        return of(V2RulesTableActions.currentTableActivesHeaderToggleComplete({ key: currentTabId, activeValue }));
      }),
    );
  });
  updateCurrentTableRowActiveState = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.updateCurrentTableRowActiveState),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const rowUuid = action.rowUuid;
        const ids: Ids = {
          projectId: currentTab?.ids.projectId as number,
          dataSetId: currentTab?.ids.dataSetId as number,
          ruleSetId: currentTab?.ids.ruleSetId as number,
        };
        this.refreshService.setRefreshForAllTables(ids);
        return of(V2RulesTableActions.updateCurrentTableRowActiveStateComplete({ key: currentTabId, rowUuid }));
      }),
    );
  });
  updateCurrentTableRowCompareState = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.updateCurrentTableRowCompareState),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const rowUuid = action.rowUuid;
        const isRelationOneToMany = action.isRelationOneToMany;
        return of(
          V2RulesTableActions.updateCurrentTableRowCompareStateComplete({
            key: currentTabId,
            rowUuid,
            isRelationOneToMany,
          }),
        );
      }),
    );
  });

  /* Labels */
  overwriteLabelsToCurrentTableRows = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.overwriteLabelsToCurrentTableRow),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const rowUuid = action.rowUuid;
        const labels = action.labels;
        return of(
          V2RulesTableActions.overwriteLabelsToCurrentTableRowsComplete({ key: currentTabId, rowUuid, labels }),
        );
      }),
    );
  });
  removeLabelFromRowInCurrentTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.removeLabelFromRowInCurrentTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const rowUuid = action.rowUuid;
        const labelId = action.labelId;
        return of(
          V2RulesTableActions.removeLabelFromRowInCurrentTableComplete({ key: currentTabId, rowUuid, labelId }),
        );
      }),
    );
  });

  /* Compare */
  markRuleSetToCompareInCurrentTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.markRuleSetToCompareInCurrentTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const single = action.single;
        const uuid = action.uuid;
        return of(V2RulesTableActions.markRuleSetToCompareInCurrentTableComplete({ key: currentTabId, single, uuid }));
      }),
    );
  });
  markAllRuleSetsToCompareInCurrentTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.markAllRuleSetsToCompareInCurrentTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const checkboxState = action.checkboxState;
        return of(
          V2RulesTableActions.markAllRuleSetsToCompareInCurrentTableComplete({ key: currentTabId, checkboxState }),
        );
      }),
    );
  });
  markFirstRuleSetToCompareInCurrentTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.markFirstRuleSetToCompareInCurrentTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        return of(V2RulesTableActions.markFirstRuleSetToCompareInCurrentTableComplete({ key: currentTabId }));
      }),
    );
  });

  /* Undo */
  undo = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.addActionToUndoStack),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        return of(V2RulesTableActions.addActionToUndoStackComplete({ key: currentTabId, undoData: action.undoData }));
      }),
    );
  });
  /* when action is performed by user clear redo stac */
  clearRedoStack = createEffect(() => {
    return this.actions$.pipe(
      ofType(...undoRedoTriggerActions),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        if (!action.isUserAction) return EMPTY;
        return of(V2RulesTableActions.clearRedoStack({ key: currentTabId }));
      }),
    );
  });
  /* Add to undo stack- When user did one of the undoRedoTriggerActions we add it to undo stack */
  removeRuleAddToUndoStack = createEffect(() => {
    return this.actions$.pipe(
      ofType(...undoRedoTriggerActions),
      withLatestFrom(
        this.store$.select(selectUndoStackIds).pipe(filterOutNullish()),
        this.store$.select(selectCurrentV2RulesTableData).pipe(filterOutNullish()),
      ),
      mergeMap(([action, currentUndoStackIds, v2RulesTableData]) => {
        const ids = currentUndoStackIds as number[];
        const highestUndoId = ids.length > 0 ? Math.max(...ids) : 0;
        if (!action.isUserAction) return EMPTY;
        const undoData = createUndoDataForUndoStack(action, highestUndoId, v2RulesTableData);
        return of(V2RulesTableActions.addActionToUndoStack({ undoData }));
      }),
    );
  });
  /* Undo and Redo combined effect */
  undoRedoAction = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.undoAction, V2RulesTableActions.redoAction),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentV2Tab)),
        this.store$.pipe(select(selectCurrentV2RulesTableUndoStack)).pipe(filterOutNullish()),
        this.store$.pipe(select(selectCurrentV2RulesTableRedoStack)).pipe(filterOutNullish()),
        (action, currentTab, undoStack, redoStack) => ({ action, currentTab, undoStack, redoStack }),
      ),
      mergeMap(({ action, currentTab, undoStack, redoStack }) => {
        const currentTabId = currentTab?.id as string;
        const undoRedoActionHandler = {
          [V2RulesTableActions.undoAction.type]: () => {
            const data = getFirstOrLastEntity(undoStack, true);
            return of(V2RulesTableActions.performUndoRedoAction({ key: currentTabId, actionType: 'undo', data }));
          },
          [V2RulesTableActions.redoAction.type]: () => {
            const data = getFirstOrLastEntity(redoStack, false);
            return of(V2RulesTableActions.performUndoRedoAction({ key: currentTabId, actionType: 'redo', data }));
          },
        };

        const handler = undoRedoActionHandler[action.type];

        if (!handler) {
          throw new Error('Could not perform undo/redo action. Action type not recognized for undoRedoAction');
        }

        return handler();
      }),
    );
  });

  /* Perform undo/redo action */
  performUndoRedoAction = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.performUndoRedoAction),
      mergeMap((action) => {
        const actionHandler = performUndoRedoActionHandlers[action.actionType]?.[action.data.action];
        if (actionHandler) return of(actionHandler(action));
        throw new Error('Could not perform undo/redo action');
      }),
    );
  });

  /* UNDO - Undo action complete */
  undoActionComplete = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.performUndoRedoAction),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const actionType = action.actionType;
        const key = currentTab?.id as string;
        const data = action.data;
        const payload = { key, data };

        if (actionType === 'undo') {
          return of(V2RulesTableActions.undoActionComplete(payload));
        }

        if (actionType === 'redo') {
          return of(V2RulesTableActions.redoActionComplete(payload));
        }

        throw new Error('Could not perform undo/redo action');
      }),
    );
  });

  /* SHOW NOTIFICATION FOR UNDO */
  showUndoNotification = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.undoActionComplete),
      map((action) => {
        const translateBase = 'project.rules.table.undo_redo.undo.';
        const undoDataActionType = action.data.action;
        const ruleString = action.data.rows[0].string;

        if (!ruleString) throw new Error('Rule string should be defined');

        this.notifyService.showNotify(
          this.translate.instant(`${translateBase}${undoDataActionType}`, { ruleString }),
          'success',
          true,
          2000,
        );

        return { type: 'NO_ACTION' };
      }),
    );
  });

  /* SHOW NOTIFICATION FOR REDO */
  showRedoNotification = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.redoActionComplete),
      map((action) => {
        const translateBase = 'project.rules.table.undo_redo.redo.';
        const undoDataActionType = action.data.action;
        const ruleString = action.data.rows[0].string;

        if (!ruleString) throw new Error('Rule string should be defined');

        this.notifyService.showNotify(
          this.translate.instant(`${translateBase}${undoDataActionType}`, { ruleString }),
          'info',
          true,
          2000,
        );

        return { type: 'NO_ACTION' };
      }),
    );
  });

  updateFilteredRowsUuids = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.updateFilteredRowsUuids),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentV2Tab)),
        this.store$.pipe(select(selectCurrentV2RulesTableFilteredUuids)),
      ),
      mergeMap(([action, currentTab, prevFiltered]) => {
        const currentTabId = currentTab?.id as string;
        const filteredRowsUuids = action.filteredRowsUuids;
        const didFilteredUuidsChange = !isEqual(sortBy(filteredRowsUuids), sortBy(prevFiltered));
        if (!didFilteredUuidsChange) return EMPTY;
        return of(V2RulesTableActions.updateFilteredRowsUuidsComplete({ key: currentTabId, filteredRowsUuids }));
      }),
    );
  });

  //Set refresh for all tables when filtered rows are updated
  // This is used to trigger a refresh of all tables when the filtered rows are updated
  updateFilteredRowsCompleteUuids = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.updateFilteredRowsUuidsComplete),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const ids: Ids = {
          projectId: currentTab?.ids.projectId as number,
          dataSetId: currentTab?.ids.dataSetId as number,
          ruleSetId: currentTab?.ids.ruleSetId as number,
        };
        this.refreshService.setRefreshForAllTables(ids);
        return of({ type: 'NO_ACTION' });
      }),
    );
  });
  //Set show needs recalculation info
  updateExamplesNeedsRecalculationInfo = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.updateFilteredRowsUuidsComplete),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const targetTableKey = currentTab?.id as string;
        return of(V2ClassifyCardActions.setShowNeedsRecalculationInfoForTargetTable({ targetTableKey }));
      }),
    );
  });

  updateShouldGoToTheFirstPageOnSort = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.updateCurrentTableRow, V2RulesTableActions.setShouldGoToTheFirstPageOnSort),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const key = currentTab?.id as string;
        if (action.type === V2RulesTableActions.setShouldGoToTheFirstPageOnSort.type) {
          return of(
            V2RulesTableActions.setShouldGoToTheFirstPageOnSortComplete({
              key,
              shouldGoToTheFirstPageOnSort: action.shouldGoToTheFirstPageOnSort,
            }),
          );
        }
        return of(
          V2RulesTableActions.setShouldGoToTheFirstPageOnSortComplete({ key, shouldGoToTheFirstPageOnSort: true }),
        );
      }),
    );
  });

  openRulesetAndWaitForData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsClosed),
      tap((action) => {
        const ids = action.selectedItem.ids;
        const text = action.selectedItem.text;
        this.treeRefreshService.openRuleSetTab(ids, text);
      }),
      debounceTime(1000),
      switchMap((action) => {
        const ngrxKey = generateNgrxKey(
          action.selectedItem.ids.projectId!,
          action.selectedItem.ids.dataSetId!,
          action.selectedItem.ids.ruleSetId!,
          0,
          'ruleSet',
        );

        // Stream 1: Wait for the new table data to be loaded
        const isDataLoaded$ = this.store$.pipe(select(isLoadingV2RulesTableData));

        // Stream 2: Wait for the refresh button to be in a ready state
        const isRefreshReady$ = this.store$.select(selectRefreshBtnState).pipe(
          filter(
            (refreshState) => refreshState === RefreshAllState.HIDDEN || refreshState === RefreshAllState.CLICKABLE,
          ),
          take(1),
          tap(() => {
            this.store$.dispatch(V2RulesTableActions.setCoverageNeedsRefetchForCurrentTab({ needsRefetch: true }));
          }),
        );

        //  Combine both streams and wait for both conditions to be met
        return combineLatest([isDataLoaded$, isRefreshReady$]).pipe(
          filter(([isLoading, refreshState]) => {
            return !isLoading && refreshState;
          }),
          // return isDataLoaded$.pipe(
          take(1), // Proceed once both conditions are true
          map(() =>
            V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpened({
              targetNgrxKey: ngrxKey,
              currentTableRowsUuids: action.currentTableRowsUuids,
              targetIds: action.selectedItem.ids,
              sourceTableKey: action.sourceTableKey,
            }),
          ),
        );
      }),
    ),
  );
  setCurrentTab$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpened),
      map((action) => {
        const targetRulesetTabId = action.targetNgrxKey;
        return V2CurrentTabAction.setCurrentTab({ currentTab: targetRulesetTabId });
      }),
    ),
  );

  setCurrentSubTabIndex$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpened),
      map(() => V2TabsActions.setCurrentSubTabIndex({ index: 0 })),
    ),
  );
  setIsSaved$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpened),
      map(() => V2TabsActions.setIsSaved({ isSaved: false })),
    ),
  );

  setRefreshForAllTablesSequential$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2RulesTableActions.setRefreshForAllTables),
      concatMap((action) => {
        const needsRefresh = true;
        const dispatchData = { ids: action.ids, needsRefresh };
        const refreshAll = RefreshAllState.CLICKABLE;
        return of(
          V2TabsActions.setIsSaved({ isSaved: false }),
          ruleSetPredictionIndicatorsRefreshChange(dispatchData),
          ruleSetQuantitativeCharacteristicsRefreshChange(dispatchData),
          ruleSetImportanceRefreshChange(dispatchData),
          predictionIndicatorsRefreshAllChange({ ids: action.ids, refreshAll }),
          rulesRefreshAllChange({ ids: action.ids, refreshAll }),
          predictionIndicatorsTestDataRefresh(dispatchData),
          predictionIndicatorsTrainingDataRefresh(dispatchData),
          V2RulesTableActions.setCoverageNeedsRefetchForCurrentTab({ needsRefetch: true }),
        );
      }),
    ),
  );

  // Copy rows from current table to another table that is already opened
  // Ten effect triggeruje akcje, V2RulesTableActions.updateFilteredRowsUuidsComplete która ustawia refreshAll dla wszystkich tabel (CLIKABLE)
  copyRowsFromCurrentTableToAnotherTable$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpened),
      withLatestFrom(this.store$.pipe(select(activeProjectSelector))),
      map(([action, project]) => {
        return V2RulesTableActions.copyRowsFromCurrentTableToAnotherTable({
          anotherV2TableKey: action.targetNgrxKey,
          currentTableRowsUuids: action.currentTableRowsUuids,
          currentTableKey: action.sourceTableKey,
          targetIds: action.targetIds,
          problemType: project.type_of_problem,
        });
      }),
    );
  });

  updateRowsFromCurrentTableToAnotherTable$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpenedCompleat),
      switchMap(async ({ targetIds }) => {
        this.store$.dispatch(V2RulesTableActions.setCoverageNeedsRefetchForCurrentTab({ needsRefetch: true }));
        const updatedAllRuleData = await this.refreshService.updateAllRulesTabData(targetIds);
        return updatedAllRuleData;
      }),
      map(() => ({ type: 'NO_ACTION' })),
    );
  });

  updateRowsFromCurrentTableToAnotherTableComplete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTable),
      map(({ targetIds }) =>
        V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpenedCompleat({ targetIds }),
      ),
    ),
  );

  isCopingRulesetUuids$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpened),
      map((action) => {
        const targetRulesetTabId = action.targetNgrxKey;
        return V2CurrentTabAction.setCurrentTab({ currentTab: targetRulesetTabId });
      }),
    ),
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private rulesCustomizeColumnsService: RulesCustomizeColumnsService,
    private ruleSetService: RuleSetService,
    private datasetService: DatasetService,
    private refreshService: RefreshService,
    private treeRefreshService: TreeviewRefreshService,
    private notifyService: NotifyService,
    private translate: TranslateService,
  ) {}
}
