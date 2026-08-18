import { Component } from '@angular/core';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';

import { Store } from '@ngrx/store';
import { ValueChangedEvent } from 'devextreme/ui/check_box';

import { AppState } from '../../../../../common/store/app-state.model';
import { V2RulesCoverageTabActions } from '../../../../../common/store/v2RulesCoverageTab/v2RulesCoverageTab.actions';
import { selectIsUniqueCoverage } from '../../../../../common/store/v2RulesCoverageTab/v2RulesCoverageTab.selectors';
import { isNotCausedByUserEvent } from '../../../../../common/utils/devExtremeEventsUtils';

@Component({
  selector: 'rolap-rules-filter-unique-coverage-toggle',
  templateUrl: './rules-filter-unique-coverage-toggle.component.html',
  styleUrls: ['./rules-filter-unique-coverage-toggle.component.scss'],
})
export class RulesFilterUniqueCoverageToggleComponent {
  public value$ = this.store.select(selectIsUniqueCoverage).pipe(filterOutNullish());

  constructor(private store: Store<AppState>) {}

  public onValueChanged(e: ValueChangedEvent): void {
    if (isNotCausedByUserEvent(e)) return;
    this.store.dispatch(V2RulesCoverageTabActions.toggleIsUniqueCoverage());
  }
}
