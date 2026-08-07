import { Component } from '@angular/core';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { Observable, map } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState, SubTabsNames } from '../../../common/store/app-state.model';
import { getCurentTabBasedOnv2CurrentTab } from '../../../common/store/ruleSets/rulesets.selectors';
import {
  isLoadingV2RulesTableData,
  selectProjectRulesTableData,
} from '../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { ProjectRulesTableData } from './project-rules-table/models/rules-table';
import { RulesTableSettingsService } from './project-rules-table/service/rules-table-settings.service';

@Component({
  selector: 'rolap-project-rules',
  templateUrl: './project-rules.component.html',
  styleUrls: ['./project-rules.component.scss'],
})
export class ProjectRulesComponent {
  public projectRulesTableData$: Observable<ProjectRulesTableData> = this.store
    .select(selectProjectRulesTableData)
    .pipe(
      filterOutNullish(),
      map((projectRulesTableData) => ({
        ...projectRulesTableData,
        displayType: SubTabsNames.RULES,
        selectMultiple: true,
        settings: this.rulesTableSettingsService.getAllProjectRulesTableSettings(SubTabsNames.RULES),
      })),
    );

  public tab$ = this.store.select(getCurentTabBasedOnv2CurrentTab).pipe(filterOutNullish());

  public isLoading$ = this.store.select(isLoadingV2RulesTableData);

  constructor(private store: Store<AppState>, private rulesTableSettingsService: RulesTableSettingsService) {}
}
