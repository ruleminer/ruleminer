import { Component, Input } from '@angular/core';

import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { FilteringRule } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';
import { V2RulesCoverageTabActions } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.actions';

@Component({
  selector: 'rolap-project-rules-coverage-filtering-rules-list',
  templateUrl: './project-rules-coverage-filtering-rules-list.component.html',
  styleUrls: ['./project-rules-coverage-filtering-rules-list.component.scss'],
})
export class ProjectRulesCoverageFilteringRulesListComponent {
  @Input() filteringRules: FilteringRule[];
  public faTimes = faTimes;

  constructor(private store: Store<AppState>) {}

  public onRuleRemoveClick(rule: FilteringRule) {
    this.store.dispatch(V2RulesCoverageTabActions.removeFilteringRule({ rule }));
  }
}
