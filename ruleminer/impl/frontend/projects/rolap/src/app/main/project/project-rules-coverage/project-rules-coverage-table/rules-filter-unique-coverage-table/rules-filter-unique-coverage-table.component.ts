import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';
import { combineLatest, map, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';

import { AppState } from '../../../../../common/store/app-state.model';
import { UniqueCoverage, VisibleRule } from '../../../../../common/store/v2RulesCoverageTab/types';
import {
  getCurrentTabFilteringRules,
  selectIsUniqueCoverage,
  selectUniqueCoverage,
} from '../../../../../common/store/v2RulesCoverageTab/v2RulesCoverageTab.selectors';
import { selectCurrentV2RulesTable } from '../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from '../../../../../common/store/v2Tabs/v2Tabs.selectors';

@Component({
  selector: 'rolap-rules-filter-unique-coverage-table',
  templateUrl: './rules-filter-unique-coverage-table.component.html',
  styleUrls: ['./rules-filter-unique-coverage-table.component.scss'],
})
export class RulesFilterUniqueCoverageTableComponent {
  public displayTable$ = this.store.select(selectIsUniqueCoverage).pipe(filterOutNullish());
  public tableWidth = 480;

  public table$ = combineLatest([
    this.store.select(getCurrentTabFilteringRules).pipe(filterOutNullish()),
    this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish()),
    this.store.select(selectCurrentV2RulesTable).pipe(filterOutNullish()),
  ]).pipe(
    switchMap(([filteringRules, currentIds, v2RulesTable]) => {
      return this.store
        .select(selectUniqueCoverage)
        .pipe(filterOutNullish())
        .pipe(
          map((uniqueCoverage) => {
            const transformedData = this.transformToRows(uniqueCoverage.unique_examples, filteringRules);
            const numberOfColumns = filteringRules.length + 1;
            const calculatedWidth = numberOfColumns * 100 + 80;
            this.tableWidth = Math.min(calculatedWidth, 800);
            return transformedData;
          }),
        );
    }),
  );

  constructor(private store: Store<AppState>, private http: HttpClient) {}
  public customizeColumns = (columns: DxiDataGridColumn[]) => {
    columns.forEach((column) => {
      if (column.dataField === 'key') {
        column.visibleIndex = 0;
        column.headerCellTemplate = 'translateTemplateHeader';
        column.cellTemplate = 'translateCellTemplate';
        column.width = 150;
      } else {
        column.headerCellTemplate = 'colorRuleTemplateHeader';
        column.caption = column.dataField;
      }
    });
  };

  private transformToRows(uniqueExamples: UniqueCoverage['unique_examples'], filteringRules: VisibleRule[]): any[] {
    const allKeys = ['p_unique', 'n_unique'];

    const rows = allKeys.map((key) => {
      const row: any = { key };
      filteringRules.forEach((rule) => {
        const uniqueExample = uniqueExamples.find((example) => example.uuid === rule.uuid);
        row[rule.ruleName] = uniqueExample ? uniqueExample[key as keyof typeof uniqueExample] : null;
      });

      return row;
    });
    return rows;
  }
}
