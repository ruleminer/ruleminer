import { Component, ViewChild, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { map } from 'rxjs';

import { Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';

import { ExportItem } from '../../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { AppState } from '../../../../common/store/app-state.model';
import { V2ComparisonActions } from '../../../../common/store/v2Comparison/v2Comparison.action';
import {
  selectComparisonCalculatedData,
  selectComparisonShowSomethingChangeWarning,
  selectCurrentV2ComparisonSecondRuleset,
} from '../../../../common/store/v2Comparison/v2Comparison.selectors';
import { selectCurrentV2Tab } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { DataGridComponent, Exporter } from '../../../../common/utils/exportUtils';
import { RulesetComparisonParserService } from '../../service/rule-set-comparison-parser.service';
import { ComparisonCalulateSimilarityButtonOutput } from '../buttons/calculate-similarity-button/types';

@Component({
  selector: 'rolap-ruleset-comparison-table',
  templateUrl: './ruleset-comparison-table.component.html',
  styleUrls: ['./ruleset-comparison-table.component.scss'],
})
export class RulesetComparisonTableComponent implements DataGridComponent {
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  private store = inject(Store<AppState>);
  private rulesetComparisonParserService = inject(RulesetComparisonParserService);
  public showSomethingChangeWarningSignal = toSignal(this.store.select(selectComparisonShowSomethingChangeWarning));
  public rulesetOneNameSignal = toSignal(
    this.store.select(selectCurrentV2Tab).pipe(
      filterOutNullish(),
      map((v2Tab) => v2Tab.text),
    ),
  );
  public rulesetTwoNameSignal = toSignal(
    this.store.select(selectCurrentV2ComparisonSecondRuleset).pipe(
      filterOutNullish(),
      map((secondRuleSet) => secondRuleSet.name),
    ),
  );
  public tableDataSignal = toSignal(this.store.select(selectComparisonCalculatedData));
  public readonly pageSize = 10;

  public exportCount: number | undefined;
  public exportItems: ExportItem[] = [
    {
      text: 'CSV',
      onClick: () => Exporter.exportData('csv', this, 'comparison'),
    },
    {
      text: 'XLSX',
      onClick: () => Exporter.exportData('xlsx', this, 'comparison'),
    },
  ];

  // When the user clicks the "Calculate similarity" button, this function is called
  public onCalculatedData(event: ComparisonCalulateSimilarityButtonOutput): void {
    const firstRulesetName = this.rulesetOneNameSignal();
    const secondRulesetName = this.rulesetTwoNameSignal();
    if (!firstRulesetName || !secondRulesetName) return;
    const { ruleSimilarity, rulesetOneData, rulesetTwoData, relationType } = event;
    this.rulesetComparisonParserService.setData(ruleSimilarity, rulesetOneData, rulesetTwoData);
    const chartData = {
      ruleSimilarity,
      rulesetOne: rulesetOneData,
      rulesetTwo: rulesetTwoData,
      relationType,
      firstRulesetName,
      secondRulesetName,
    };
    this.store.dispatch(V2ComparisonActions.setChartData({ data: chartData }));
    this.store.dispatch(V2ComparisonActions.setShowSomethingChangeWarning({ value: false }));
  }

  public getTotalCount(): number {
    return this.rulesetComparisonParserService.getTotalCount();
  }

  public getDataGrid(): DxDataGridComponent {
    return this.dataGrid;
  }

  public clearDataGrid() {
    this.dataGrid.dataSource = [];
  }
}
