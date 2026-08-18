import { Component, Input } from '@angular/core';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { Observable, map } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { V2RulesCoverageTabActions } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.actions';
import { getCurrentTabFilteringRules } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.selectors';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';
import { environment } from 'projects/rolap/src/environments/environment';

import { DataField } from '../../../../../service/models/rules-customize-columns-api';
import { DisplayType } from '../../../models/rules-table';

@Component({
  selector: 'rolap-rules-table-coverage-filter-header',
  templateUrl: './rules-table-coverage-filter-header.component.html',
  styleUrls: ['./rules-table-coverage-filter-header.component.scss'],
})
export class RulesTableCoverageFilterHeaderComponent {
  @Input() dataField: DataField;
  @Input() problemType: ProblemTypes;
  @Input() displayType: DisplayType;

  public readonly coverageMaxRulesFiltering = environment.coverageMaxRulesFiltering;
  public numberOfSelectedRules: Observable<number> = this.store.select(getCurrentTabFilteringRules).pipe(
    filterOutNullish(),
    map((r) => r.length),
  );

  constructor(private store: Store<AppState>) {}

  public clearFilteringRules() {
    this.store.dispatch(V2RulesCoverageTabActions.removeAllFilteringRules());
  }
}
