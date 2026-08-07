import { Component, Input, OnChanges, OnDestroy } from '@angular/core';

import { filterOutNullish } from '../../../../../../common/utils/rxjsUtils';
import { Subscription, combineLatest } from 'rxjs';

import { faTrash } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../common/store/app-state.model';
import {
  canDeleteOrDeactivateRules,
  selectCurrentV2RulesTableActiveUuids,
} from '../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { NewRow as RuleTableRow } from '../../../../models/ruleset';

@Component({
  selector: 'rolap-rule-delete-button',
  templateUrl: './rule-delete-button.component.html',
  styleUrls: ['./rule-delete-button.component.scss'],
})
export class RuleDeleteButtonComponent implements OnChanges, OnDestroy {
  @Input() row: RuleTableRow;

  public canDeleteOrDeactivateRules: boolean;
  public disabled = false;
  public faTrash = faTrash;

  private subscription: Subscription;

  constructor(private store: Store<AppState>) {}

  ngOnChanges(): void {
    this.setData();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private setData() {
    this.subscription?.unsubscribe();
    const activeUuids$ = this.store.select(selectCurrentV2RulesTableActiveUuids).pipe(filterOutNullish());
    const canDeleteOrDeactivateRules$ = this.store.select(canDeleteOrDeactivateRules);
    this.subscription = combineLatest([activeUuids$, canDeleteOrDeactivateRules$]).subscribe(
      ([activeUuids, canDeleteOrDeactivateRules]) => {
        this.canDeleteOrDeactivateRules = canDeleteOrDeactivateRules;
        this.disabled = !canDeleteOrDeactivateRules && activeUuids.includes(this.row.uuid);
      },
    );
  }
}
