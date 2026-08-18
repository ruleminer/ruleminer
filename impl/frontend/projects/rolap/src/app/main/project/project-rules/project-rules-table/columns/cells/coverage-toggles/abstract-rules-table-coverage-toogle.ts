import { ChangeDetectorRef, Directive, Input, OnDestroy } from '@angular/core';

import { Subject, Subscription } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { FilteringRule, VisibleRule } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';

import { RulesTableRow } from '../../../../../models/project';

@Directive()
export abstract class AbstractRulesTableCoverageToggleComponent implements OnDestroy {
  @Input() row: RulesTableRow;
  public selectedRules: (VisibleRule | FilteringRule)[];
  public disabled = false;
  protected ngUnsubscribe = new Subject<void>();
  protected activeSub: Subscription;

  constructor(protected store: Store<AppState>, protected changeDetector: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.activeSub?.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onValueChange(checked: boolean): void {
    const rule: VisibleRule | FilteringRule = { uuid: this.row.uuid, ruleName: this.row.autoIncrement.toString() };
    this.setValueInStore(rule, checked);
  }

  protected abstract setValueInStore(rule: VisibleRule | FilteringRule, checked: boolean): void;
}
