import { ChangeDetectorRef, Component, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { VisibleRule } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';
import { V2RulesCoverageTabActions } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.actions';
import { getCurrentTabVisibleRules } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.selectors';
import { environment } from 'projects/rolap/src/environments/environment';

import { selectCurrentV2RulesTableActiveUuids } from '../../../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { AbstractRulesTableCoverageToggleComponent } from '../abstract-rules-table-coverage-toogle';

@Component({
  selector: 'rolap-rules-table-coverage-visibility-toggle',
  templateUrl: './rules-table-coverage-visibility-toggle.component.html',
  styleUrls: ['./rules-table-coverage-visibility-toggle.component.scss'],
})
export class RulesTableCoverageVisibilityToggleComponent
  extends AbstractRulesTableCoverageToggleComponent
  implements OnInit, OnChanges, OnDestroy
{
  private canSelectMoreRows = true;

  constructor(store: Store<AppState>, changeDetector: ChangeDetectorRef) {
    super(store, changeDetector);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['row'] || !this.row) return;
    this.updateDisabledFlag();
  }

  ngOnInit(): void {
    this.store
      .select(getCurrentTabVisibleRules)
      .pipe(filterOutNullish(), takeUntil(this.ngUnsubscribe))
      .subscribe((visibleRules) => {
        this.selectedRules = visibleRules;
        this.canSelectMoreRows = this.selectedRules.length < environment.coverageMaxRulesVisible;
        this.updateDisabledFlag();
        this.changeDetector.detectChanges();
      });
  }

  protected override setValueInStore(rule: VisibleRule, checked: boolean): void {
    const payload = { rule: rule };
    if (checked) {
      this.store.dispatch(V2RulesCoverageTabActions.addVisibleRule(payload));
    } else {
      this.store.dispatch(V2RulesCoverageTabActions.removeVisibleRule(payload));
    }
  }

  private updateDisabledFlag() {
    this.activeSub?.unsubscribe();
    this.activeSub = this.store
      .select(selectCurrentV2RulesTableActiveUuids)
      .pipe(filterOutNullish())
      .subscribe((activeUuids) => {
        this.disabled = !this.canSelectMoreRows || !activeUuids.includes(this.row.uuid);
        this.changeDetector.detectChanges();
      });
  }
}
