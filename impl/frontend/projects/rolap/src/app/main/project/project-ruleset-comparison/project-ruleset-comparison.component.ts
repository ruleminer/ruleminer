import { Component, inject } from '@angular/core';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { combineLatest } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { Store } from '@ngrx/store';

import { AppState, RuleTableUse, SubTabsNames } from '../../../common/store/app-state.model';
import {
  isRuleComparisonLoading,
  selectComparisonChartData,
  selectComparisonDataToCompare,
  selectCurrentV2ComparisonForm,
} from '../../../common/store/v2Comparison/v2Comparison.selectors';
import { selectProjectRulesTableData } from '../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { ProjectRulesTableData } from '../project-rules/project-rules-table/models/rules-table';
import { RulesTableSettingsService } from '../project-rules/project-rules-table/service/rules-table-settings.service';
import { RulesetComparisonParserService } from '../service/rule-set-comparison-parser.service';
import { SecondProjectRulesTableData } from './types';

@Component({
  selector: 'rolap-project-ruleset-comparison',
  templateUrl: './project-ruleset-comparison.component.html',
  styleUrls: ['./project-ruleset-comparison.component.scss'],
  providers: [RulesetComparisonParserService],
})
export class ProjectRulesetComparisonComponent {
  private store = inject(Store<AppState>);
  private rulesTableSettingsService = inject(RulesTableSettingsService);

  public readonly RuleTableUse = RuleTableUse;
  public readonly SubTabsNames = SubTabsNames;

  public chartData$ = this.store.select(selectComparisonChartData).pipe(
    map((chartData) => ({
      data: chartData,
      shouldShow: chartData && !chartData.relationType,
    })),
  );
  public projectRulesTableData: ProjectRulesTableData;
  public secondProjectRulesTableData: SecondProjectRulesTableData;
  public isLoading$ = this.store.select(isRuleComparisonLoading);
  public rulesetDataToCompare$ = this.store.select(selectComparisonDataToCompare).pipe(filterOutNullish());

  public tablesData$ = combineLatest([
    this.store.select(selectCurrentV2ComparisonForm).pipe(filterOutNullish()),
    this.store.select(selectProjectRulesTableData).pipe(filterOutNullish(), debounceTime(100)),
    this.store.select(isRuleComparisonLoading).pipe(filterOutNullish()),
  ]).pipe(
    map(([formValue, projectRulesTableData, isLoading]) => ({
      projectRulesTableData: {
        ...projectRulesTableData,
        displayType: SubTabsNames.RULE_COMPARISON,
        selectMultiple: !formValue.relationType || false,
        settings: this.rulesTableSettingsService.getAllProjectRulesTableSettings(SubTabsNames.RULE_COMPARISON),
      },
      secondProjectRulesTableData: {
        ...projectRulesTableData,
        ids: {
          ...projectRulesTableData.ids,
          ruleSetId: null,
        },
        displayType: RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
        selectMultiple: true,
        settings: this.rulesTableSettingsService.getAllProjectRulesTableSettings(
          RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
        ),
      },
      isLoading,
    })),
  );
}
