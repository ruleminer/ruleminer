import { Injectable, OnDestroy } from '@angular/core';

import { Observable, Subject, filter, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import dxDataGrid, { Column, ContextMenuPreparingEvent, Row } from 'devextreme/ui/data_grid';
import { ContextMenuItem } from 'projects/rolap/src/app/common/interfaces/context-menu.model';
import { TableInstanceService } from 'projects/rolap/src/app/common/services/table-instance/table-instance.service';
import { AppState, SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { V2ClassifyCardActions } from 'projects/rolap/src/app/common/store/v2Classify/v2Classify.action';
import { VisibleRule, v2RulesCoverageTabRuleSet } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';
import { V2RulesCoverageTabActions } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.actions';

import { V2TabsActions } from '../../../../common/store/v2Tabs/v2Tabs.action';
import { DatasetService } from '../../dataset/service/dataset.service';
import { Rule } from '../../models/ruleset';
import { CoverageMatrix } from './models';
import {
  COVERAGE_COLUMN_NAME_PREFIX,
  PREDICTION_COLUMN,
  RULES_COVERING_EXAMPLE_COLUMN,
} from './project-rules-coverage-table.component';

@Injectable()
export class RulesCoverageTableContextMenuHandler implements OnDestroy {
  private dataGrid$: Observable<dxDataGrid>;
  private ngUnsubscribe = new Subject<void>();

  constructor(
    private translate: TranslateService,
    private store: Store<AppState>,
    private tableInstanceService: TableInstanceService,
    private datasetService: DatasetService,
  ) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public setDataGrid(dataGrid$: Observable<dxDataGrid>) {
    this.dataGrid$ = dataGrid$;
  }

  public prepareContextMenu(e: ContextMenuPreparingEvent, datasetColumnNames: string[]) {
    if (e.target === 'header') {
      e.items = this.prepareContextMenuForHeaderCell(e.column!);
    } else {
      e.items = this.prepareContextMenuForRowCell(datasetColumnNames, e.row);
    }
  }

  private prepareContextMenuForRowCell(datasetColumnNames: string[], row?: any): ContextMenuItem[] {
    return [
      {
        text: this.translate.instant('project.rules_coverage.select_example'),
        onItemClick: () => {
          this.onExplainRowClick(datasetColumnNames, row);
        },
      },
    ];
  }

  private prepareContextMenuForHeaderCell(column: Column<any, any>): ContextMenuItem[] | undefined {
    // only columns containing rules coverage data have context menu
    const isRulesCoverageColumn = column.name?.includes(COVERAGE_COLUMN_NAME_PREFIX);
    if (!isRulesCoverageColumn) return undefined;

    const ruleName: string = column.name!.replace(COVERAGE_COLUMN_NAME_PREFIX, '');
    const ruleUuid: string = column.dataField!;
    const rule: VisibleRule = { ruleName, uuid: ruleUuid };
    return [
      {
        text: this.translate.instant('project.rules_coverage.deselect_rule'),
        onItemClick: () => {
          this.onRemoveColumnClick(rule);
        },
      },
    ];
  }

  /**
   * Remove columns that are not in the dataset.
   */
  private removeColumnsNotFromDataset(selectedRows: any[], datasetColumnNames: string[]) {
    const allowedColumns = [...datasetColumnNames];
    allowedColumns.push(this.datasetService.ID_COLUMN_DISPLAY_NAME); // to not remove the column with index

    selectedRows.forEach((row: { [key: string]: any }) => {
      const keysToRemove: string[] = [];

      for (const key of Object.keys(row)) {
        const isInDataset = allowedColumns.includes(key);
        const isPredictionColumn = key === PREDICTION_COLUMN;
        const isRulesCoveringColumn = key === RULES_COVERING_EXAMPLE_COLUMN;
        const isCoverageColumn = key.startsWith(COVERAGE_COLUMN_NAME_PREFIX);
        const isUuidColumn = key.length === 36 && key.includes('-'); // UUID format check

        if (!isInDataset && !isPredictionColumn && !isRulesCoveringColumn && (isCoverageColumn || isUuidColumn)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => delete row[key]);
    });
  }

  private onExplainRowClick(datasetColumnNames: string[], row?: any) {
    if (!row || !row.data) {
      // Fallback to selected rows if no row data provided
      this.dataGrid$
        .pipe(
          filter((e) => !!e),
          take(1),
          takeUntil(this.ngUnsubscribe),
        )
        .subscribe((dataGridInstance: dxDataGrid<any, any>) => {
          const selectedRows = dataGridInstance.getSelectedRowsData();
          this.processRowsData([...selectedRows], datasetColumnNames);
        });
    } else {
      this.dataGrid$
        .pipe(
          filter((e) => !!e),
          take(1),
          takeUntil(this.ngUnsubscribe),
        )
        .subscribe((dataGridInstance: dxDataGrid<any, any>) => {
          let rowData = row.data;

          // If row data is incomplete, try to get it by row index
          if (Object.keys(rowData).length <= 2) {
            const visibleRows = dataGridInstance.getVisibleRows();
            const targetRow = visibleRows.find((r) => r.rowIndex === row.rowIndex);
            if (targetRow && targetRow.data) {
              rowData = targetRow.data;
            }
          }

          this.processRowsData([{ ...rowData }], datasetColumnNames);
        });
    }
  }

  private processRowsData(selectedRows: any[], datasetColumnNames: string[]) {
    this.removeColumnsNotFromDataset(selectedRows, datasetColumnNames);
    selectedRows.sort((a, b) => a['#'] - b['#']); // sorting selected rows by index ascending

    selectedRows.map((x) => {
      delete x[PREDICTION_COLUMN];
    });

    this.store.dispatch(V2ClassifyCardActions.addByContextMenu({ selectedRows: selectedRows }));
    this.store.dispatch(V2TabsActions.setCurrentSubTabIndexBySubTabName({ name: SubTabsNames.EXAMPLE }));
  }

  private onRemoveColumnClick(rule: VisibleRule) {
    this.store.dispatch(V2RulesCoverageTabActions.removeVisibleRule({ rule }));
  }
}

@Injectable()
export class CoverageTableDataAppender {
  private dataGrid$: Observable<dxDataGrid>;
  private ngUnsubscribe = new Subject<void>();
  private appendedColumns: string[] = [];

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public setDataGrid(dataGrid$: Observable<dxDataGrid>) {
    this.dataGrid$ = dataGrid$;
    this.appendedColumns = [];
  }

  public appendCoverageData(coverageMatrix: CoverageMatrix, rulesUuidsToRulesNames: Record<string, string>) {
    this.appendedColumns = [];
    this.dataGrid$
      .pipe(
        filter((e) => !!e),
        take(1),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((dataGridInstance: dxDataGrid<any, any>) => {
        dataGridInstance.getVisibleRows().forEach((row, index) => {
          this.appendPredictionColumn(row, index, coverageMatrix);
          this.appendCoverageColumns(row, index, coverageMatrix, rulesUuidsToRulesNames);
        });
      });
  }

  public isCoverageDataAlreadyAppended(visibleRows: Row<any, any>[]): boolean {
    // check if given rows already have coverage data appended (dxDataGrid caches previously visible pages data)
    if (this.appendedColumns.length === 0 || visibleRows.length === 0) return false;
    return visibleRows.reduce((prev: any, current: any) => {
      const isAnyColumnNullish = this.appendedColumns.some(
        (key) => current.data[key] == undefined || current.data[key] === null,
      );
      return prev && !isAnyColumnNullish;
    }, true);
  }

  private appendPredictionColumn(row: Row<any, any>, index: number, coverageMatrix: CoverageMatrix) {
    row.data[PREDICTION_COLUMN] = coverageMatrix.prediction[index];
    this.appendedColumns.push(PREDICTION_COLUMN);
  }

  private appendCoverageColumns(
    row: Row<any, any>,
    index: number,
    coverageMatrix: CoverageMatrix,
    rulesUuidsToRulesNames: Record<string, string>,
  ) {
    const rulesUuidsCoveringExample: VisibleRule[] = [];
    Object.keys(coverageMatrix.coverage_matrix).forEach((ruleUuid: string) => {
      const ruleCoverage: boolean[] = coverageMatrix.coverage_matrix[ruleUuid];
      row.data[ruleUuid] = ruleCoverage[index];
      this.appendedColumns.push(ruleUuid);

      const isRuleCoveringExample: boolean = ruleCoverage[index];
      if (isRuleCoveringExample) {
        const ruleName: string = rulesUuidsToRulesNames[ruleUuid];
        rulesUuidsCoveringExample.push({ uuid: ruleUuid, ruleName: ruleName });
      }
    });
    row.data[RULES_COVERING_EXAMPLE_COLUMN] = rulesUuidsCoveringExample;
    this.appendedColumns.push(RULES_COVERING_EXAMPLE_COLUMN);
  }
}

export function ruleSetsRulesAreDifferent(a: v2RulesCoverageTabRuleSet, b: v2RulesCoverageTabRuleSet): boolean {
  if (a === undefined || b === undefined) return true;
  return a.rules.map((e: Rule) => e.uuid).join() !== b.rules.map((e: Rule) => e.uuid).join();
}
