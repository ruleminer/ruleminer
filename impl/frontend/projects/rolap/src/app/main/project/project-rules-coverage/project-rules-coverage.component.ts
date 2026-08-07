import { Component } from '@angular/core';

import { Observable, combineLatest, map } from 'rxjs';

import { Store } from '@ngrx/store';

import { DatasetViewTableType } from '../../../common/components/data-grid/dataset-view-table/types';
import { AppState, SubTabsNames } from '../../../common/store/app-state.model';
import {
  isLoadingV2RulesTableData,
  selectProjectRulesTableData,
} from '../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { V2Tab } from '../../../common/store/v2Tabs/types';
// import { ProjectRulesTableData } from '../project-rules/project-rules-table/models/rules-table';
import { RulesTableSettingsService } from '../project-rules/project-rules-table/service/rules-table-settings.service';

@Component({
  selector: 'rolap-project-rules-coverage',
  templateUrl: './project-rules-coverage.component.html',
  styleUrls: ['./project-rules-coverage.component.scss'],
})
export class ProjectRulesCoverageComponent {
  public readonly datasetViewTableType = DatasetViewTableType.RULE_SET_COVERAGE;
  public v2Tab: V2Tab | null | undefined;
  // TODO: add type projectRulesTableData
  public combinedData$: Observable<{ projectRulesTableData: any; isLoading: boolean }> = combineLatest([
    this.store.select(selectProjectRulesTableData).pipe(
      map((projectRulesTableData) => ({
        ...projectRulesTableData,
        displayType: SubTabsNames.RULES_COVERAGE,
        selectMultiple: true,
        settings: this.rulesTableSettingsService.getAllProjectRulesTableSettings(SubTabsNames.RULES_COVERAGE),
      })),
    ),
    this.store.select(isLoadingV2RulesTableData),
  ]).pipe(map(([projectRulesTableData, isLoading]) => ({ projectRulesTableData, isLoading })));

  constructor(private store: Store<AppState>, private rulesTableSettingsService: RulesTableSettingsService) {}
}
