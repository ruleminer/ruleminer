import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { EMPTY, catchError, concatMap, exhaustMap, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EntityState } from '@ngrx/entity';
import { Store, select } from '@ngrx/store';
import { nanoid } from 'nanoid';

import { DatasetService } from '../../../main/project/dataset/service/dataset.service';
import { RefreshService } from '../../../main/project/service/refresh.service';
import { AppState } from '../app-state.model';
import { activeProjectProblemTypeSelector } from '../project/project.selectors';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { V2RulesTableActions } from '../v2RulesTable/v2RulesTable.action';
import {
  selectCurrentV2RulesTableData,
  selectCurrentV2RulesTableMeta,
  selectCurrentV2RulesTableStatistics,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
} from '../v2RulesTable/v2RulesTable.selectors';
import { generateNgrxKey, isRuleSet } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { selectCurrentV2Tab } from '../v2Tabs/v2Tabs.selectors';
import { ExampleResult, V2Classify, V2ClassifyCard } from './types';
import { castExampleAttributesToCorrectTypes, convertExampleTableToEntityState } from './utils';
import { V2ClassifyActions, V2ClassifyCardActions } from './v2Classify.action';
import { selectCurrentV2ClassifyCards } from './v2Classify.selectors';

@Injectable()
export class V2ClassifyEffects {
  //When we add ruleset we want to load one classify card
  addRuleSet = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.addTab),
      exhaustMap((action) => {
        const type = action.tab.type;
        if (!isRuleSet(type)) return EMPTY;
        const projectId = action.tab.ids.projectId as number;
        const dataSetId = action.tab.ids.dataSetId as number;
        const ruleSetId = action.tab.ids.ruleSetId as number;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, type);

        return this.datasetService.getDatasetTableBasedOnAttributes(projectId, ruleSetId, dataSetId, 1, 0).pipe(
          concatMap((response) => {
            const classify = {
              id,
              cards: {},
            };
            const cardsEntityState: EntityState<V2ClassifyCard> = convertExampleTableToEntityState(
              response.exampleTable,
            );
            classify.cards = cardsEntityState;
            return of(V2ClassifyActions.add({ classify: classify as V2Classify }));
          }),
        );
      }),
    ),
  );

  //Wehen we remove all v2Tabs we want to remove all classify
  removeAllTabs = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap((action) => of(V2ClassifyActions.removeAll())),
    ),
  );

  //When we remove tab that uses classify we want to remove classify
  removeTab = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2ClassifyActions.remove({ key }));
      }),
    ),
  );

  // add new card (after click 'Add another example' button)
  // the table is filled with data from the first row of the rule set
  addCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.add),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentV2TabId)),
        this.store$.pipe(select(selectCurrentV2ClassifyCards)),
      ),
      mergeMap(([action, currentTabId, currentClassifyCards]) => {
        const classifyKey = currentTabId;

        if (!currentClassifyCards || currentClassifyCards.length === 0)
          throw new Error('At least one card should be present');
        //we want to copy example table from last card
        const lastCard = currentClassifyCards[currentClassifyCards.length - 1];
        const card = {
          id: nanoid(),
          exampleTable: lastCard.exampleTable,
          exampleResult: undefined,
          showNeedsRecalculationInfo: false,
          calculatedBefore: false,
        };
        return of(V2ClassifyCardActions.addComplete({ classifyKey, card }));
      }),
    ),
  );

  // add new card (or multiple cards)
  // this effect is used when user select example by context menu in another tab
  addCardByContextMenu$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.addByContextMenu),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, currentTabId]) => {
        const cardsToAdd = action.selectedRows;
        const classifyKey = currentTabId;

        return of(V2ClassifyCardActions.addByContextMenuComplete({ classifyKey, selectedRows: cardsToAdd }));
      }),
    ),
  );

  removeCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.remove),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, currentTabId]) => {
        const key = action.key;
        const classifyKey = currentTabId;

        return of(V2ClassifyCardActions.removeComplete({ classifyKey, key }));
      }),
    ),
  );

  setExampleTable$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.setExampleTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, currentTabId]) => {
        const key = action.key;
        const classifyKey = currentTabId;
        const exampleTable = action.exampleTable;

        return of(V2ClassifyCardActions.setExampleTableComplete({ classifyKey, key, exampleTable }));
      }),
    ),
  );

  updateExampleTable$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.updateExampleTable),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, currentTabId]) => {
        const key = action.key;
        const classifyKey = currentTabId;
        const exampleTable = action.exampleTable;
        return of(V2ClassifyCardActions.setExampleTableComplete({ classifyKey, key, exampleTable }));
      }),
    ),
  );

  //TODO: add loading and error states to classify cards.
  recalculate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.recalculate),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentV2Tab)),
        this.store$.pipe(select(selectCurrentV2ClassifyCards)),
        this.store$.select(selectCurrentV2RulesTableData).pipe(filterOutNullish()),
        this.store$.select(selectCurrentV2RulesTableMeta).pipe(filterOutNullish()),
        this.store$.select(selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered).pipe(filterOutNullish()),
        this.store$.select(activeProjectProblemTypeSelector).pipe(filterOutNullish()),
      ),
      mergeMap(([action, currentTab, currentClassifyCards, v2TableData, v2TableMeta, activeAndFilteredRowsUuids]) => {
        const { key, labelAttribute, columnsTypes } = action;
        const exampleTable = currentClassifyCards?.find((card) => card.id === key)?.exampleTable[0];
        if (!exampleTable) return EMPTY;
        const exampleValue = { ...exampleTable };
        delete exampleValue[this.datasetService.ID_COLUMN_DISPLAY_NAME];
        delete exampleValue[labelAttribute];
        const exampleValueConverted = castExampleAttributesToCorrectTypes(exampleValue, columnsTypes);
        return this.refreshService
          .calculateLocalExplainability(
            v2TableData,
            v2TableMeta,
            activeAndFilteredRowsUuids,
            [exampleValueConverted],
            currentTab?.ids.projectId!,
            currentTab?.ids.dataSetId!,
            currentTab?.ids.ruleSetId!,
          )
          .pipe(
            map((result) => {
              const coveringRules = result[0]?.covering_rules || {};
              const rulesUuidsToDisplay = Object.keys(coveringRules);
              const resultTableData = [...v2TableData].filter((rule: any) => {
                return rulesUuidsToDisplay?.some((uuid: string) => {
                  return rule.uuid === uuid;
                });
              });
              const exampleResult: ExampleResult = {
                covering_rules: coveringRules,
                decision: result[0].decision,
                resultTableData,
              };
              return {
                result: exampleResult,
                classifyKey: currentTab?.id as string,
                key: action.key,
              };
            }),
          );
      }),
      switchMap(({ classifyKey, key, result }) =>
        of(V2ClassifyCardActions.recalculateComplete({ classifyKey, key, result })),
      ),
    ),
  );

  //on recalculate complete we want to update Needs Recalculation to false
  recalculateComplete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.recalculateComplete),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, currentTabId]) => {
        const key = action.key;
        const classifyKey = currentTabId;
        return of(
          V2ClassifyCardActions.setShowNeedsRecalculationInfo({ classifyKey, key, showNeedsRecalculationInfo: false }),
        );
      }),
    ),
  );

  //When something changes in big table we want to set needs recalculation to true
  setShowNeedsRecalculationInfoToTrueForAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        V2RulesTableActions.updateCurrentTableRowComplete,
        V2RulesTableActions.addRowToCurrentTableComplete,
        V2RulesTableActions.removeRowFromCurrentTableComplete,
        V2RulesTableActions.addMultipleRowsToCurrentTableComplete,
        V2RulesTableActions.removeMultipleRowsFromCurrentTableComplete,
      ),
      map(() => V2ClassifyCardActions.setShowNeedsRecalculationInfoToTrueForAllCurrent()),
    ),
  );

  setShowNeedsRecalculationInfoToTrueForAllCurrent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.setShowNeedsRecalculationInfoToTrueForAllCurrent),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2TabId))),
      map(([action, currentTabId]) => {
        return V2ClassifyCardActions.setShowNeedsRecalculationInfoToTrueForAllCurrentComplete({ key: currentTabId });
      }),
    ),
  );

  setShowNeedsRecalculationInfoForTargetTable$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpenedCompleat),
      map(({ targetIds }) => {
        const targetTableKey = generateNgrxKey(
          targetIds.projectId!,
          targetIds.dataSetId!,
          targetIds.ruleSetId!,
          0,
          'ruleSet',
        );
        return V2ClassifyCardActions.setShowNeedsRecalculationInfoForTargetTable({ targetTableKey });
      }),
    ),
  );

  // Add random card effect
  addRandomCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.addRandomCard),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentV2Tab)),
        this.store$.select(selectCurrentV2RulesTableStatistics),
      ),
      mergeMap(([_, currentTab, rulesStatistics]) => {
        if (!currentTab || !currentTab.ids || !rulesStatistics) return EMPTY;
        const projectId = currentTab.ids.projectId as number;
        const dataSetId = currentTab.ids.dataSetId as number;
        const ruleSetId = currentTab.ids.ruleSetId as number;
        const classifyKey = currentTab.id;
        const { number_of_rows } = rulesStatistics;
        const randomRowOffset = Math.floor(Math.random() * number_of_rows);
        return this.datasetService
          .getDatasetTableBasedOnAttributes(projectId, ruleSetId, dataSetId, 1, randomRowOffset)
          .pipe(
            map((response) => {
              if (!response || !response.exampleTable || response.exampleTable.length === 0) {
                throw new Error('No random examples available');
              }

              const randomExample = response.exampleTable[0];
              const card: V2ClassifyCard = {
                id: nanoid(),
                exampleTable: [randomExample],
                exampleResult: undefined,
                showNeedsRecalculationInfo: false,
                calculatedBefore: false,
              };

              return V2ClassifyCardActions.addRandomCardComplete({ classifyKey, card });
            }),
            catchError((error) => {
              console.error('Error fetching random example:', error);
              return EMPTY;
            }),
          );
      }),
    ),
  );

  // Add empty card effect
  addEmptyCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2ClassifyCardActions.addEmptyCard),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([, currentTab]) => {
        if (!currentTab || !currentTab.ids) return EMPTY;

        const projectId = currentTab.ids.projectId as number;
        const dataSetId = currentTab.ids.dataSetId as number;
        const ruleSetId = currentTab.ids.ruleSetId as number;
        const classifyKey = currentTab.id;

        return this.datasetService.getDatasetTableBasedOnAttributes(projectId, ruleSetId, dataSetId, 1, 0).pipe(
          mergeMap((response) => {
            if (!response || !response.exampleTable || response.exampleTable.length === 0) {
              throw new Error('No random examples available');
            }
            const exampleTable = Object.fromEntries(
              Object.entries(response.exampleTable[0]).map(([key, value]) => [
                key,
                key === this.datasetService.ID_COLUMN_DISPLAY_NAME ? value : null,
              ]),
            );

            const card: V2ClassifyCard = {
              id: nanoid(),
              exampleTable: [exampleTable],
              exampleResult: undefined,
              showNeedsRecalculationInfo: false,
              calculatedBefore: false,
            };

            return of(
              V2ClassifyCardActions.addEmptyCardComplete({
                classifyKey,
                card,
              }),
            );
          }),
        );
      }),
    ),
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private datasetService: DatasetService,
    private refreshService: RefreshService,
  ) {}
}
